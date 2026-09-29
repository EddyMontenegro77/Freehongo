import { Injectable } from '@angular/core';
import { CharacterList } from '../../../shared/models/lists/list.model';
import { db, FreeHongoDB } from '../../../core/db/db';
import { CreateCharacterListInput } from '../../../shared/models/lists/list.model';

@Injectable({
  providedIn: 'root',
})
export class ListService {
  protected database: FreeHongoDB = db;

  // LOCAL METHODS
  async createList(input: CreateCharacterListInput): Promise<string> {
    const listId = crypto.randomUUID();

    const newList: CharacterList = {
      ...input,
      listId,
      createdAt: new Date(),
      syncStatus: 'local-only',
    };
    await this.database.lists.add(newList);
    return listId;
  }

  async updateList(listId: string, changes: Partial<CharacterList>): Promise<void> {
    await this.database.lists.update(listId, {
      ...changes,
      updatedAt: new Date(),
    });
  }

  async addCharacterToList(listId: string, unicode: string): Promise<boolean> {
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
  }

  async deleteList(listId: string): Promise<void> {
    await this.database.lists.delete(listId);
  }

  async getAllLists(): Promise<CharacterList[]> {
    return this.database.lists.toArray();
  }

  async getListById(listId: string): Promise<CharacterList | undefined> {
    return this.database.lists.get(listId);
  }

  async getListByName(name: string): Promise<CharacterList | undefined> {
    return this.database.lists.where('name').equals(name).first();
  }

  // CLOUD METHODS
}
