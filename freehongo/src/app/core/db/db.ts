import Dexie, { Table } from 'dexie';
import { List } from '../../shared/models/lists/list.model';

export class FreeHongoDB extends Dexie {
  lists!: Table<List, string>;

  constructor() {
    super('FreeHongoDB');

    this.version(1).stores({
      lists: '&listId, name, createdAt, updatedAt, syncStatus',
    });
  }
}

export const db = new FreeHongoDB();
