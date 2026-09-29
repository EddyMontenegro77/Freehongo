import { Injectable, inject, signal } from '@angular/core';
import {
  CharacterList,
  CharacterListType,
  CreateCharacterListInput,
} from '../../../shared/models/lists/list.model';
import { ListService } from './list.service';

export type CharacterListTypeFilter = 'any' | CharacterListType;

@Injectable({
  providedIn: 'root',
})
export class ListsFacade {
  private readonly listService = inject(ListService);

  readonly lists = signal<CharacterList[]>([]);
  readonly filteredLists = signal<CharacterList[]>([]);
  readonly isLoading = signal(false);
  readonly loadError = signal<string | null>(null);

  async loadLists(): Promise<void> {
    this.isLoading.set(true);
    this.loadError.set(null);

    try {
      const loadedLists = await this.listService.getAllLists();
      this.lists.set(loadedLists);
      this.filteredLists.set(loadedLists);
    } catch (error) {
      console.error(error);
      this.lists.set([]);
      this.filteredLists.set([]);
      this.loadError.set('Could not load lists.');
    } finally {
      this.isLoading.set(false);
    }
  }

  filterLists(name: string, type: CharacterListTypeFilter): void {
    const normalizedName = name.trim().toLowerCase();

    this.filteredLists.set(
      this.lists().filter((list) => {
        const matchesName = list.name.toLowerCase().includes(normalizedName);
        const matchesType = type === 'any' || list.type === type;

        return matchesName && matchesType;
      }),
    );
  }

  createList(input: CreateCharacterListInput): Promise<string> {
    return this.listService.createList(input);
  }

  async addCharacterToList(listId: string, unicode: string): Promise<boolean> {
    const added = await this.listService.addCharacterToList(listId, unicode);

    if (!added) {
      return false;
    }

    const appendCharacter = (list: CharacterList): CharacterList => {
      if (list.listId !== listId || list.characters.includes(unicode)) {
        return list;
      }

      return {
        ...list,
        characters: [...list.characters, unicode],
      };
    };

    this.lists.update((lists) => lists.map(appendCharacter));
    this.filteredLists.update((lists) => lists.map(appendCharacter));

    return true;
  }

  updateList(listId: string, changes: Partial<CharacterList>): Promise<void> {
    return this.listService.updateList(listId, changes);
  }

  deleteList(listId: string): Promise<void> {
    return this.listService.deleteList(listId);
  }

  getListById(listId: string): Promise<CharacterList | undefined> {
    return this.listService.getListById(listId);
  }
}
