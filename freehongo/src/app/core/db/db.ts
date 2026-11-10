import Dexie, { Table } from 'dexie';
import { CharacterList } from '../../shared/models/lists/list.model';
import {
  StoredCharacterStat,
  StoredQuizAnswer,
  StoredQuizSession,
} from '../../shared/models/quizes/quizes-storage.interface';

export type SyncStatus = 'pending' | 'synced' | 'failed';

export interface MetaEntry {
  key: string;
  value: unknown;
}

export const GUEST_DB_NAME: string = 'FreeHongoDB_Guest';
export const userDbName = (userId: string) => `FreeHongoDB_${userId}`;

export class FreeHongoDB extends Dexie {
  lists!: Table<CharacterList, string>;
  quizSessions!: Table<StoredQuizSession, string>;
  quizAnswers!: Table<StoredQuizAnswer, [string, string]>;
  characterStats!: Table<StoredCharacterStat, [string, string]>;
  meta!: Table<MetaEntry, string>;

  constructor(name: string = GUEST_DB_NAME) {
    super(name);

    this.version(1).stores({
      lists: '&listId, name, createdAt, updatedAt, syncStatus',
    });

    this.version(2).stores({
      quizSessions: 'quizSessionId, listId, startedAt, syncStatus',
      quizAnswers: '[quizSessionId+unicode], unicode',
      characterStats: '[unicode+answerType], lastSeenAt',
      meta: 'key',
    });

    this.version(3)
      .stores({})
      .upgrade(async (tx) => {
        await tx
          .table('quizSessions')
          .toCollection()
          .modify((s) => {
            if (!['pending', 'synced', 'failed'].includes(s.syncStatus)) s.syncStatus = 'pending';
          });
        await tx
          .table('lists')
          .toCollection()
          .modify((l) => {
            if (!['pending', 'synced', 'failed'].includes(l.syncStatus)) l.syncStatus = 'pending';
          });
      });

    this.on('versionchange', () => {
      this.close();
      location.reload();
    });
  }
}
