import { inject, Service } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { DatabaseService } from '../../db/services/database.service';
import { FreeHongoDB } from '../../db/db';
import { CharacterList } from '../../../shared/models/lists/list.model';
import { PullResult, SyncPushOptions, SyncResult } from '../models/sync.models';
import { environment } from '../../../../environments/environments';
import {
  classifyError,
  emptyPullResult,
  fetchAllPages,
  isHttpStatus,
  toIsoString,
  toTime,
} from '../sync.utils';

const VALID_LIST_TYPES = new Set(['hiragana', 'katakana', 'kanji', 'mixed']);

interface RemoteListDto {
  listId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  listType: string;
  charUnicodes: string[];
}

@Service()
export class ListSyncService {
  private readonly http = inject(HttpClient);
  private readonly databaseService = inject(DatabaseService);

  private get db() {
    return this.databaseService.database;
  }

  async syncPending(options: SyncPushOptions = {}): Promise<SyncResult> {
    const db = this.db;
    const statuses = options.includeFailed ? ['pending', 'failed'] : ['pending'];
    const pending = await db.lists.where('syncStatus').anyOf(statuses).toArray();

    const result: SyncResult = { total: pending.length, synced: 0, failed: 0, errors: [] };

    for (const list of pending) {
      if (!db.isOpen()) {
        result.aborted = true;
        break;
      }

      try {
        await this.syncList(list);
        await this.markSynced(db, list);
        result.synced++;
      } catch (error) {
        const kind = classifyError(error);

        if (kind === 'permanent') {
          await db.lists.update(list.listId, { syncStatus: 'failed' });
        }

        result.failed++;
        result.errors.push({ id: list.listId, error });

        if (kind === 'abort') {
          result.aborted = true;
          break;
        }
      }
    }

    return result;
  }

  private async syncList(list: CharacterList): Promise<void> {
    if (list.deletedAt) {
      try {
        await firstValueFrom(
          this.http.request<void>('DELETE', `${environment.apiUrl}/lists/delete`, {
            body: { listId: list.listId },
          }),
        );
      } catch (error) {
        if (!isHttpStatus(error, 404)) throw error;
      }
      return;
    }

    await firstValueFrom(
      this.http.post<void>(`${environment.apiUrl}/lists/create`, {
        listId: list.listId,
        name: list.name,
        createdAt: toIsoString(list.createdAt),
        isPublic: list.isPublic,
        listType: list.type,
      }),
    );

    await firstValueFrom(
      this.http.put<void>(`${environment.apiUrl}/lists/update`, {
        listId: list.listId,
        name: list.name,
        isPublic: list.isPublic,
        listType: list.type,
      }),
    );

    if (list.characters.length > 0) {
      await firstValueFrom(
        this.http.put<void>(`${environment.apiUrl}/lists/update/characters`, {
          listId: list.listId,
          charUnicodes: list.characters,
        }),
      );
    }
  }

  private async markSynced(db: FreeHongoDB, sent: CharacterList): Promise<void> {
    await db.transaction('rw', db.lists, async () => {
      const current = await db.lists.get(sent.listId);
      if (!current) return;

      const unchanged =
        toTime(current.updatedAt) === toTime(sent.updatedAt) &&
        toTime(current.deletedAt) === toTime(sent.deletedAt);

      if (unchanged) {
        await db.lists.update(sent.listId, { syncStatus: 'synced' });
      }
    });
  }

  async pullRemote(): Promise<PullResult> {
    const db = this.db;
    const result = emptyPullResult();

    let remote: CharacterList[];
    try {
      remote = await this.fetchRemoteLists();
    } catch (error) {
      result.failed++;
      result.errors.push({ id: 'lists', error });
      return result;
    }

    result.fetched = remote.length;
    const remoteIds = new Set(remote.map((list) => list.listId));

    try {
      await db.transaction('rw', db.lists, async () => {
        const locals = await db.lists.toArray();
        const localById = new Map(locals.map((list) => [list.listId, list]));

        const toPut: CharacterList[] = [];

        for (const incoming of remote) {
          const local = localById.get(incoming.listId);

          if (!local) {
            toPut.push(incoming);
            result.inserted++;
            continue;
          }

          if (local.deletedAt || local.syncStatus !== 'synced') continue;

          if (toTime(incoming.updatedAt) !== toTime(local.updatedAt)) {
            toPut.push(incoming);
            result.updated++;
          }
        }

        const toRemove = locals
          .filter(
            (local) =>
              !local.deletedAt && local.syncStatus === 'synced' && !remoteIds.has(local.listId),
          )
          .map((local) => local.listId);

        if (toPut.length) await db.lists.bulkPut(toPut);
        if (toRemove.length) await db.lists.bulkDelete(toRemove);
        result.removed = toRemove.length;
      });
    } catch (error) {
      result.failed++;
      result.errors.push({ id: 'lists-merge', error });
      result.inserted = result.updated = result.removed = 0;
    }

    return result;
  }

  async fetchRemoteLists(): Promise<CharacterList[]> {
    const remote = await fetchAllPages<RemoteListDto>(async (limit, offset) => {
      const response = await firstValueFrom(
        this.http.get<{ lists: RemoteListDto[] }>(`${environment.apiUrl}/lists/user`, {
          params: new HttpParams().set('limit', limit).set('offset', offset).set('full', true),
        }),
      );
      return response.lists ?? [];
    });

    const unique = new Map(remote.map((list) => [list.listId, list]));

    return [...unique.values()]
      .filter((list) => VALID_LIST_TYPES.has(list.listType))
      .map(
        (list) =>
          ({
            listId: list.listId,
            name: list.name,
            createdAt: list.createdAt,
            updatedAt: list.updatedAt,
            isPublic: list.isPublic,
            type: list.listType,
            characters: list.charUnicodes ?? [],
            syncStatus: 'synced',
          }) as CharacterList,
      );
  }
}
