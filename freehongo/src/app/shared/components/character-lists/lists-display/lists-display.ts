import {
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  signal,
  ViewChild,
  ChangeDetectionStrategy
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

export type ListsDisplayMode = 'manage' | 'select' | 'quiz';

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
  ],
  templateUrl: './lists-display.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './lists-display.scss',
})
export class ListsDisplay {
  private readonly listsFacade = inject(ListsFacade);
  private readonly destroyRef = inject(DestroyRef);

  mode = input<ListsDisplayMode>('manage');
  compact = input(false);
  listSelected = output<string>();
  listCreated = output<string>();
  quizSelected = output<string>();

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

  // List filters
  listName = new FormControl<string>('');
  characterType = new FormControl<CharacterListTypeFilter>('any');

  characterOptions: SegmentedOption<CharacterListTypeFilter>[] = [
    {
      label: 'katakana',
      value: 'katakana',
    },
    {
      label: 'hiragana',
      value: 'hiragana',
    },
    {
      label: 'kanji',
      value: 'kanji',
    },
    {
      label: 'mixed',
      value: 'mixed',
    },
    {
      label: 'any',
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
    this.fetchUserLists();

    this.listName.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.filterLists();
    });

    this.characterType.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.filterLists();
    });
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

    if (!name || !type) {
      this.operationError.set('Enter a name and choose a list type.');
      return;
    }

    try {
      const listId = await this.listsFacade.createList({
        name,
        type,
        characters: [],
      });

      this.newListName.reset('');
      this.newListType.setValue('mixed');
      this.toggleCreatingList();
      await this.fetchUserLists();

      if (this.mode() === 'select') {
        this.listCreated.emit(listId);
      }
    } catch (error) {
      console.error(error);
      this.operationError.set('Could not create the list.');
    }
  }

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
  }

  fetchUserLists = async (): Promise<void> => {
    await this.listsFacade.loadLists();
    this.filterLists();
  }

  filterLists(): void {
    const name = this.listName.value ?? '';
    const type = this.characterType.value ?? 'any';

    this.listsFacade.filterLists(name, type);
  }
}
