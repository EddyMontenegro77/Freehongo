import { inject, Injectable } from '@angular/core';
import { CharacterList, CreateCharacterListInput } from '../../../shared/models/lists/list.model';
import { FreeHongoDB } from '../../../core/db/db';
import { nowIso } from '../../../shared/utils/date.utils';
import { newId } from '../../../shared/utils/uuid.utils';
import { DatabaseService } from '../../../core/db/services/database.service';
import { SyncTriggerService } from '../../../core/sync/services/sync-trigger.service';

type EditableListFields = Partial<
  Omit<CharacterList, 'listId' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'syncStatus'>
>;

function normalizeName(name: string): string {
  const trimmed = name.trim();

  if (!trimmed) {
    throw new Error('A list needs a name.');
  }

  return trimmed;
}

@Injectable({
  providedIn: 'root',
})
export class ListService {
  private readonly databaseService = inject(DatabaseService);
  private readonly syncTrigger = inject(SyncTriggerService);

  protected get database(): FreeHongoDB {
    return this.databaseService.database;
  }

  async createList(input: CreateCharacterListInput): Promise<string> {
    const listId = newId();
    const now = nowIso();

    const newList: CharacterList = {
      ...input,
      name: normalizeName(input.name),
      characters: [...new Set(input.characters)],
      listId,
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
    };

    await this.database.lists.add(newList);
    this.syncTrigger.schedule();
    return listId;
  }

  async updateList(listId: string, changes: EditableListFields): Promise<void> {
    const cleaned: EditableListFields = { ...changes };

    if (cleaned.name !== undefined) {
      cleaned.name = normalizeName(cleaned.name);
    }

    if (cleaned.characters !== undefined) {
      cleaned.characters = [...new Set(cleaned.characters)];
    }

    await this.database.lists.update(listId, {
      ...cleaned,
      updatedAt: nowIso(),
      syncStatus: 'pending',
    });
    this.syncTrigger.schedule();
  }

  async addCharacterToList(listId: string, unicode: string): Promise<boolean> {
    return this.database.transaction('rw', this.database.lists, async () => {
      const list = await this.getListById(listId);

      if (!list) {
        throw new Error('List not found');
      }

      if (list.characters.includes(unicode)) {
        return false;
      }

      await this.updateList(listId, {
        characters: [...list.characters, unicode],
      });

      return true;
    });
  }

  async deleteList(listId: string): Promise<void> {
    await this.database.lists.update(listId, {
      deletedAt: nowIso(),
      updatedAt: nowIso(),
      syncStatus: 'pending',
    });
    this.syncTrigger.schedule();
  }

  async getAllLists(): Promise<CharacterList[]> {
    return this.database.lists.filter((list) => !list.deletedAt).toArray();
  }

  async getListById(listId: string): Promise<CharacterList | undefined> {
    const list = await this.database.lists.get(listId);
    return list && !list.deletedAt ? list : undefined;
  }

  async getListByName(name: string): Promise<CharacterList | undefined> {
    return this.database.lists
      .where('name')
      .equals(name.trim())
      .and((list) => !list.deletedAt)
      .first();
  }
}
