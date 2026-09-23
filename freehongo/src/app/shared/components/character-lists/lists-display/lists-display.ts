import { Component, inject, signal } from '@angular/core';
import { FormControl } from '@angular/forms';

import { InputField } from '../../input/input';
import { ActionBtn } from '../../action-btn/action-btn';
import { IconBtn } from '../../icon-btn/icon-btn';
import { SegmentedControl, SegmentedOption } from '../../segmented-control/segmented-control';
import { NavigationBtn } from '../../navigation-btn/navigation-btn';

import { ListService } from '../../../../features/lists/services/list.service';
import {
  CharacterList,
  CharacterListType,
  CreateCharacterListInput,
} from '../../../models/lists/list.model';
import { SelectField, SelectOption } from '../../select/select';

type CharacterListTypeFilter = 'any' | CharacterListType;

@Component({
  selector: 'app-lists-display',
  imports: [InputField, ActionBtn, IconBtn, SegmentedControl, NavigationBtn, SelectField],
  templateUrl: './lists-display.html',
  styleUrl: './lists-display.scss',
})
export class ListsDisplay {
  private listService = inject(ListService);

  lists = signal<CharacterList[]>([]);
  filteredLists = signal<CharacterList[]>([]);

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

    this.listName.valueChanges.subscribe(() => {
      this.filterLists();
    });

    this.characterType.valueChanges.subscribe(() => {
      this.filterLists();
    });
  }

  toggleCreatingList = (): void => {
    this.creatingList.set(!this.creatingList());
  };

  createList = (): void => {
    const name = this.newListName.value;
    const type = this.newListType.value;

    if (!name || !type) {
      return;
    }

    const newListInput: CreateCharacterListInput = {
      name,
      type,
      characters: [],
    };

    this.listService.createList(newListInput);
  };

  async fetchUserLists(): Promise<void> {
    const data = await this.listService.getAllLists();

    this.lists.set(data);
    this.filterLists();
  }

  filterLists(): void {
    const name = (this.listName.value ?? '').trim().toLowerCase();
    const type = this.characterType.value ?? 'any';

    const filtered = this.lists().filter((list) => {
      const matchesName = list.name.toLowerCase().includes(name);

      const matchesType = type === 'any' || list.type === type;

      return matchesName && matchesType;
    });

    this.filteredLists.set(filtered);
  }
}
