import Dexie, { Table } from 'dexie';
import { CharacterList } from '../../shared/models/lists/list.model';
import {
  StoredCharacterStat,
  StoredQuizAnswer,
  StoredQuizSession,
} from '../../shared/models/quizes/quizes-storage.interface';

export interface MetaEntry {
  key: string;
  value: unknown;
}

export class FreeHongoDB extends Dexie {
  lists!: Table<CharacterList, string>;
  quizSessions!: Table<StoredQuizSession, string>;
  quizAnswers!: Table<StoredQuizAnswer, [string, string]>;
  characterStats!: Table<StoredCharacterStat, [string, string]>;
  meta!: Table<MetaEntry, string>;

  constructor() {
    super('FreeHongoDB');

    this.version(1).stores({
      lists: '&listId, name, createdAt, updatedAt, syncStatus',
    });

    // Only the new tables go here; `lists` is unchanged and carries over.
    this.version(2).stores({
      quizSessions: 'quizSessionId, listId, startedAt, syncStatus',
      quizAnswers: '[quizSessionId+unicode], unicode',
      characterStats: '[unicode+answerType], lastSeenAt',
      meta: 'key',
    });
  }
}

export const db = new FreeHongoDB();
