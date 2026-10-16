import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ListsFacade } from '../../services/lists.facade.service';
import { CharacterList } from '../../../../shared/models/lists/list.model';
import { Card } from '../../../../shared/components/card/card';
import { UnicodeCharacterPipe } from '../../../../shared/pipes/unicode.pipe';
import { IconBtn } from '../../../../shared/components/icon-btn/icon-btn';
import { Router } from '@angular/router';
import { getCharacterTypeFromUnicode } from '../../../../shared/models/japanese/character.helper';
import { ActionBtn } from '../../../../shared/components/action-btn/action-btn';
import { InputField } from '../../../../shared/components/input/input';
import { SelectField, SelectOption } from '../../../../shared/components/select/select';
import { CharacterListType } from '../../../../shared/models/lists/list.model';
import { LoadingState } from '../../../../shared/components/app-state/loading-state/loading-state';
import { ErrorState } from '../../../../shared/components/app-state/error-state/error-state';
import { Confirmation } from '../../../../shared/components/confirmation/confirmation';
import { DatePipe } from '@angular/common';
import { nowIso } from '../../../../shared/utils/date.utils';
import { ToggleButton } from '../../../../shared/components/toggle-button/toggle-button';

@Component({
  selector: 'app-view-list',
  imports: [
    Card,
    UnicodeCharacterPipe,
    IconBtn,
    ActionBtn,
    InputField,
    SelectField,
    LoadingState,
    ErrorState,
    Confirmation,
    DatePipe,
    ToggleButton,
  ],
  templateUrl: './view-list.html',
  styleUrl: './view-list.scss',
})
export class ViewList {
  private readonly listsFacade = inject(ListsFacade);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  originalList = signal<CharacterList | undefined>(undefined);
  modifiedList = signal<CharacterList | undefined>(undefined);
  editMode: boolean = false;
  isSaving = signal(false);
  isListPublic = signal(false);
  saveError = signal<string | null>(null);
  isLoading = signal(true);
  loadError = signal<string | null>(null);
  pendingCharacter = signal<string | null>(null);

  readonly listTypes: CharacterListType[] = ['hiragana', 'katakana', 'kanji', 'mixed'];
  readonly listTypeOptions: ReadonlyArray<SelectOption> = this.listTypes.map((type) => ({
    label: type,
    value: type,
  }));

  async ngOnInit() {
    const listId = this.route.snapshot.paramMap.get('id');

    if (!listId) {
      this.loadError.set('List not found.');
      this.isLoading.set(false);
      return;
    }

    try {
      const list = await this.listsFacade.getListById(listId);

      if (!list) {
        this.loadError.set('List not found.');
        return;
      }

      this.originalList.set(list);
      this.modifiedList.set(structuredClone(list));
    } catch (error) {
      console.error(error);
      this.loadError.set('Could not load the list.');
    } finally {
      this.isLoading.set(false);
    }
  }

  enterEditMode = (): void => {
    this.saveError.set(null);
    this.editMode = true;
  };

  updateName = (name: string): void => {
    const list = this.modifiedList();

    if (!list) {
      return;
    }
    this.modifiedList.set({ ...list, name });
  };

  updatePublic = (isPublic: boolean): void => {
    const list = this.modifiedList();

    if (list) {
      this.modifiedList.set({ ...list, isPublic });
    }
  };

  updateType = (type: string): void => {
    if (!this.listTypes.includes(type as CharacterListType)) {
      return;
    }

    const list = this.modifiedList();

    if (list) {
      this.modifiedList.set({ ...list, type: type as CharacterListType });
    }
  };

  requestRemoveCharacter = (char: string): void => {
    this.pendingCharacter.set(char);
  };

  removeCharacterFromList = (): void => {
    const char = this.pendingCharacter();
    const list = this.modifiedList();

    if (!list || !char) {
      return;
    }

    const index = list.characters.indexOf(char);

    if (index !== -1) {
      this.modifiedList.set({
        ...list,
        characters: list.characters.filter((_, characterIndex) => characterIndex !== index),
      });
    }

    this.pendingCharacter.set(null);
  };

  closeRemoveConfirmation = (): void => {
    this.pendingCharacter.set(null);
  };

  retryLoad = (): Promise<void> => {
    this.isLoading.set(true);
    this.loadError.set(null);
    return this.ngOnInit();
  };

  saveChanges = async (): Promise<void> => {
    const list = this.modifiedList();

    if (!list || this.isSaving()) {
      return;
    }

    this.isSaving.set(true);
    this.saveError.set(null);

    try {
      // Whole modified object to BD
      await this.listsFacade.updateList(list.listId, {
        name: list.name.trim(),
        type: list.type,
        isPublic: list.isPublic,
        characters: list.characters,
      });

      const savedList: CharacterList = {
        ...list,
        name: list.name.trim(),
        updatedAt: nowIso(),
        syncStatus: 'pending',
      };

      this.originalList.set(structuredClone(savedList));
      this.modifiedList.set(structuredClone(savedList));
      this.editMode = false;
    } catch (error) {
      console.error(error);
      this.saveError.set('Could not save changes.');
    } finally {
      this.isSaving.set(false);
    }
  };

  cancelChanges = (): void => {
    const original = this.originalList();

    if (original) {
      this.modifiedList.set(structuredClone(original));
      this.saveError.set(null);
    }

    this.editMode = false;
  };

  goToCharacterDetails = (char: string) => {
    const charType = getCharacterTypeFromUnicode(char);
    this.router.navigate(['/characters/info/', charType, char]);
  };
}
