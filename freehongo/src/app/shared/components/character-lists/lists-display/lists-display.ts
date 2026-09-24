import { Component, DestroyRef, inject, input, output, signal } from '@angular/core';
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

export type ListsDisplayMode = 'manage' | 'select';

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
  ],
  templateUrl: './lists-display.html',
  styleUrl: './lists-display.scss',
})
export class ListsDisplay {
  private readonly listsFacade = inject(ListsFacade);
  private readonly destroyRef = inject(DestroyRef);

  mode = input<ListsDisplayMode>('manage');
  listSelected = output<string>();
  listCreated = output<string>();

  lists = this.listsFacade.lists;
  filteredLists = this.listsFacade.filteredLists;
  isLoading = this.listsFacade.isLoading;
  loadError = this.listsFacade.loadError;

  creatingList = signal<boolean>(false);

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
    this.creatingList.set(!this.creatingList());
  };

  async createList(): Promise<void> {
    const name = this.newListName.value?.trim();
    const type = this.newListType.value;

    if (!name || !type) {
      return;
    }

    const listId = await this.listsFacade.createList({
      name,
      type,
      characters: [],
    });

    this.toggleCreatingList();
    await this.fetchUserLists();

    if (this.mode() === 'select') {
      this.listCreated.emit(listId);
    }
  }

  async fetchUserLists(): Promise<void> {
    await this.listsFacade.loadLists();
    this.filterLists();
  }

  filterLists(): void {
    const name = this.listName.value ?? '';
    const type = this.characterType.value ?? 'any';

    this.listsFacade.filterLists(name, type);
  }
}
