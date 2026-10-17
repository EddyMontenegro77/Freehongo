import { Injectable } from '@angular/core';
import { CharacterList, CreateCharacterListInput } from '../../../shared/models/lists/list.model';
import { db, FreeHongoDB } from '../../../core/db/db';
import { nowIso } from '../../../shared/utils/date.utils';
import { newId } from '../../../shared/utils/uuid.utils';

/** Fields a caller may change. Bookkeeping fields are managed by the service. */
type EditableListFields = Partial<
  Omit<CharacterList, 'listId' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'syncStatus'>
>;

function normalizeName(name: string): string {
  const trimmed = name.trim();

  // Mirrors CHECK (length(trim(name)) > 0) in the cloud database.
  if (!trimmed) {
    throw new Error('A list needs a name.');
  }

  return trimmed;
}

@Injectable({
  providedIn: 'root',
})
export class ListService {
  protected database: FreeHongoDB = db;

  // LOCAL METHODS
  async createList(input: CreateCharacterListInput): Promise<string> {
    const listId = newId();
    const now = nowIso();

    const newList: CharacterList = {
      ...input,
      name: normalizeName(input.name),
      // Mirrors UNIQUE (list_id, unicode) in the cloud database.
      characters: [...new Set(input.characters)],
      listId,
      isPublic: false,
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
    };

    await this.database.lists.add(newList);
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
      // Any edit must be uploaded again, even if the list was already synced.
      syncStatus: 'pending',
    });
  }

  async addCharacterToList(listId: string, unicode: string): Promise<boolean> {
    // One transaction so two quick additions can't overwrite each other.
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

  /**
   * Soft delete: the list is hidden but kept, so the sync can tell the cloud it was deleted.
   * It can be removed for good once that deletion has been uploaded.
   */
  async deleteList(listId: string): Promise<void> {
    await this.database.lists.update(listId, {
      deletedAt: nowIso(),
      updatedAt: nowIso(),
      syncStatus: 'pending',
    });
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

  // CLOUD METHODS
}
