import { inject, Service, signal } from '@angular/core';
import { CharacterListTypeFilter } from './lists.facade.service';
import { CharacterList, PublicListInfo, PublicListSource } from '../../../shared/models/lists/list.model';
import { PublicListsService } from './public-lists.service';
import { firstValueFrom, Subscription } from 'rxjs';

interface ActiveQuery {
  source: PublicListSource;
  name: string;
  type: CharacterListTypeFilter;
}

@Service()
export class PublicListsFacadeService {
  private readonly service = inject(PublicListsService);
  private readonly pageSize = 20;

  readonly lists = signal<PublicListInfo[]>([]);
  readonly isLoading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly hasMore = signal(false);

  private offset = 0;
  private request?: Subscription;
  private query: ActiveQuery | null = null;

  /** Nueva búsqueda: reinicia resultados y paginación. */
  search(source: PublicListSource, name: string, type: CharacterListTypeFilter): void {
    this.query = { source, name, type };
    this.offset = 0;
    this.lists.set([]);
    this.hasMore.set(false);
    this.fetch(false);
  }

  loadMore(): void {
    if (this.isLoading() || !this.hasMore()) return;
    this.fetch(true);
  }

  clear(): void {
    this.request?.unsubscribe();
    this.query = null;
    this.offset = 0;
    this.lists.set([]);
    this.hasMore.set(false);
    this.isLoading.set(false);
    this.loadError.set(null);
  }

  async getListById(source: PublicListSource, listId: string): Promise<CharacterList> {
    const list = await firstValueFrom(this.service.getDetail(source, listId));
    return {
      listId: list.listId,
      name: list.name,
      isPublic: list.isPublic,
      type: list.listType,
      characters: list.charUnicodes,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
      syncStatus: 'synced',
    };
  }

  private fetch(append: boolean): void {
    if (!this.query) return;
    const { source, name, type } = this.query;

    this.request?.unsubscribe();
    this.isLoading.set(true);
    this.loadError.set(null);

    this.request = this.service
      .getPreview(source, {
        name: name.trim(),
        listType: type === 'any' ? undefined : type,
        limit: this.pageSize,
        offset: this.offset,
      })
      .subscribe({
        next: (res) => {
          const page = res.lists ?? [];
          this.lists.update((current) => (append ? [...current, ...page] : page));
          this.offset += page.length;
          this.hasMore.set(page.length === this.pageSize);
          this.isLoading.set(false);
        },
        error: (err: unknown) => {
          console.error(err);
          this.loadError.set('Could not load lists.');
          this.isLoading.set(false);
        },
      });
  }
}
