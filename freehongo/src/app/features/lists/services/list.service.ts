import { Injectable } from '@angular/core';
import { List } from '../../../shared/models/lists/list.model';
import { db } from '../../../core/db/db';
import { CreateListInput } from '../../../shared/models/lists/list.model';

@Injectable({
  providedIn: 'root',
})
export class ListService {
  // LOCAL METHODS
  async createList(input: CreateListInput): Promise<string> {
    const listId = crypto.randomUUID();

    const newList: List = {
      ...input,
      listId,
      createdAt: new Date(),
      syncStatus: 'local-only',
    };
    await db.lists.add(newList);
    return listId;
  }

  async updateList(listId: string, changes: Partial<List>): Promise<void> {
    await db.lists.update(listId, {
      ...changes,
      updatedAt: new Date(),
    });
  }

  async deleteList(listId: string): Promise<void> {
    await db.lists.delete(listId);
  }

  async getAllLists(): Promise<List[]> {
    return db.lists.toArray();
  }

  async getListById(listId: string): Promise<List | undefined> {
    return db.lists.get(listId);
  }

  async getListByName(name: string): Promise<List | undefined> {
    return db.lists.get(name);
  }

  // CLOUD METHODS
}
