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
      this.lists.set(await this.listService.getAllLists());
    } catch (error) {
      console.error(error);
      this.lists.set([]);
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

  addCharacterToList(listId: string, unicode: string): Promise<boolean> {
    return this.listService.addCharacterToList(listId, unicode);
  }
}
