import {
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  OnInit,
  output,
  signal,
  ViewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { InputField } from '../../input/input';
import { ActionBtn } from '../../action-btn/action-btn';
import { IconBtn } from '../../icon-btn/icon-btn';
import { SegmentedControl, SegmentedOption } from '../../segmented-control/segmented-control';
import { NavigationBtn } from '../../navigation-btn/navigation-btn';

import {
  CharacterListTypeFilter,
  ListsFacade,
} from '../../../../features/lists/services/lists.facade.service';
import { CharacterListType } from '../../../models/lists/list.model';
import { SelectField, SelectOption } from '../../select/select';
import { UnicodeCharacterPipe } from '../../../pipes/unicode.pipe';
import { LoadingState } from '../../app-state/loading-state/loading-state';
import { ErrorState } from '../../app-state/error-state/error-state';
import { Confirmation } from '../../confirmation/confirmation';
import { ToggleButton } from '../../toggle-button/toggle-button';
import { AuthService } from '../../../services/auth/auth.service';
import { SyncService } from '../../../../core/sync/sync.service';
import { Card } from '../../card/card';
import { PublicListsFacadeService } from '../../../../features/lists/services/public-lists.facade.service';
import { debounceTime, merge } from 'rxjs';

export type ListsDisplayMode = 'manage' | 'select' | 'quiz';
export type ListPublicOptions = 'private' | 'public' | 'official';
export type QuizListSelection = { listId: string; source: ListPublicOptions };

@Component({
  selector: 'app-lists-display',
  imports: [
    InputField,
    ActionBtn,
    IconBtn,
    SegmentedControl,
    NavigationBtn,
    SelectField,
    UnicodeCharacterPipe,
    DatePipe,
    LoadingState,
    ErrorState,
    Confirmation,
    ToggleButton,
    Card,
  ],
  templateUrl: './lists-display.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './lists-display.scss',
})
export class ListsDisplay implements OnInit {
  private readonly listsFacade = inject(ListsFacade);
  private readonly destroyRef = inject(DestroyRef);
  readonly publicListsFacade = inject(PublicListsFacadeService);
  readonly auth = inject(AuthService);
  readonly syncService = inject(SyncService);

  mode = input<ListsDisplayMode>('manage');
  compact = input(false);
  listSelected = output<string>();
  listCreated = output<string>();
  quizSelected = output<string | QuizListSelection>();

  lists = this.listsFacade.lists;
  filteredLists = this.listsFacade.filteredLists;
  isLoading = this.listsFacade.isLoading;
  loadError = this.listsFacade.loadError;

  creatingList = signal<boolean>(false);
  pendingDeleteListId = signal<string | null>(null);
  operationError = signal<string | null>(null);

  @ViewChild('createForm') createForm?: ElementRef<HTMLElement>;

  newListName = new FormControl<string>('');
  newListType = new FormControl<CharacterListType>('mixed');
  newListPublic = new FormControl(false, {
    nonNullable: true,
  });

  listName = new FormControl<string>('');
  characterType = new FormControl<CharacterListTypeFilter>('any');
  listPublicOptionSelected = new FormControl<ListPublicOptions>('private');

  listPublicOptions: SegmentedOption<ListPublicOptions>[] = [
    { label: 'Private', value: 'private' },
    { label: 'Public', value: 'public' },
    { label: 'Official', value: 'official' },
  ];

  characterOptions: SegmentedOption<CharacterListTypeFilter>[] = [
    {
      label: 'Katakana',
      value: 'katakana',
    },
    {
      label: 'Hiragana',
      value: 'hiragana',
    },
    {
      label: 'Kanji',
      value: 'kanji',
    },
    {
      label: 'Mixed',
      value: 'mixed',
    },
    {
      label: 'Any',
      value: 'any',
    },
  ];

  listTypeOptions: SelectOption<CharacterListType>[] = [
    {
      label: 'Hiragana',
      value: 'hiragana',
    },
    {
      label: 'Katakana',
      value: 'katakana',
    },
    {
      label: 'Kanji',
      value: 'kanji',
    },
    {
      label: 'Mixed',
      value: 'mixed',
    },
  ];

  ngOnInit(): void {
    // La suscripción va primero para que el setValue de initLists() dispare applyFilters()
    merge(
      this.listName.valueChanges.pipe(debounceTime(300)),
      this.characterType.valueChanges,
      this.listPublicOptionSelected.valueChanges,
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.applyFilters());

    void this.initLists();
  }

  private async initLists(): Promise<void> {
    await this.fetchUserLists();

    const noPrivateLists = this.lists().length === 0 && !this.loadError();

    if (this.mode() === 'quiz' && noPrivateLists) {
      this.listPublicOptionSelected.setValue('official');
    }
  }

  applyFilters(): void {
    const source = this.listPublicOptionSelected.value ?? 'private';
    const name = this.listName.value ?? '';
    const type = this.characterType.value ?? 'any';

    if (source === 'private') {
      this.publicListsFacade.clear();
      this.filterLists();
      return;
    }

    this.publicListsFacade.search(source, name, type);
  }

  loadMorePublic = (): void => this.publicListsFacade.loadMore();
  retryPublic = (): void => this.applyFilters();

  trySync = async (): Promise<void> => {
    this.operationError.set(null);
    try {
      await this.syncService.sync();
      await this.fetchUserLists();
    } catch (error) {
      console.error(error);
      this.operationError.set('Could not sync your lists.');
    }
  };

  updatePublic(value: boolean): void {
    this.newListPublic.setValue(value);
  }

  toggleCreatingList = (): void => {
    this.operationError.set(null);
    const shouldShowForm = !this.creatingList();
    this.creatingList.set(shouldShowForm);

    if (shouldShowForm && this.compact()) {
      setTimeout(() => {
        this.createForm?.nativeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      });
    }
  };

  createList = async (): Promise<void> => {
    const name = this.newListName.value?.trim();
    const type = this.newListType.value;
    const isPublic = this.newListPublic.value;

    if (!name || !type) {
      this.operationError.set('Enter a name and choose a list type.');
      return;
    }

    try {
      const listId = await this.listsFacade.createList({
        name,
        type,
        isPublic,
        characters: [],
      });

      this.newListName.reset('');
      this.newListType.setValue('mixed');
      this.newListPublic.setValue(false);
      this.toggleCreatingList();
      await this.fetchUserLists();

      if (this.mode() === 'select') {
        this.listCreated.emit(listId);
      }
    } catch (error) {
      console.error(error);
      this.operationError.set('Could not create the list.');
    }
  };

  requestDeleteList = (listId: string): void => {
    this.operationError.set(null);
    this.pendingDeleteListId.set(listId);
  };

  cancelDelete = (): void => {
    this.pendingDeleteListId.set(null);
  };

  deleteList = async (): Promise<void> => {
    const listId = this.pendingDeleteListId();

    if (!listId) {
      return;
    }

    try {
      await this.listsFacade.deleteList(listId);
      this.pendingDeleteListId.set(null);
      await this.fetchUserLists();
    } catch (error) {
      console.error(error);
      this.pendingDeleteListId.set(null);
      this.operationError.set('Could not delete the list.');
    }
  };

  fetchUserLists = async (): Promise<void> => {
    await this.listsFacade.loadLists();
    this.filterLists();
  };

  filterLists(): void {
    const name = this.listName.value ?? '';
    const type = this.characterType.value ?? 'any';

    this.listsFacade.filterLists(name, type);
  }

  isPublicView(): boolean {
    return this.listPublicOptionSelected.value !== 'private';
  }

  quizSelection(listId: string): string | QuizListSelection {
    const source = this.listPublicOptionSelected.value ?? 'private';
    return source === 'private' ? listId : { listId, source };
  }
}
