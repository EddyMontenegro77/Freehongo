import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { InputField } from '../../../../shared/components/input/input';
import { CharacterType } from '../../../../shared/models/japanese/character.type';
import { kanaType } from '../../../../shared/models/japanese/kana.type';
import { SelectField } from '../../../../shared/components/select/select';
import {
  SegmentedControl,
  SegmentedOption,
} from '../../../../shared/components/segmented-control/segmented-control';
import { LoadingState } from '../../../../shared/components/app-state/loading-state/loading-state';
import { ErrorState } from '../../../../shared/components/app-state/error-state/error-state';
import {
  characterPickerFacadeService,
  CharacterPickerFilters,
  CharacterPickerGeneralFilters,
  CharacterPickerItem,
  CharacterPickerPageResult,
  CharacterPickerKanaFilters,
  CharacterPickerKanjiFilters,
} from '../../services/character-picker.facade.service';
import { ActionBtn } from '../../../../shared/components/action-btn/action-btn';
import { CharacterCard } from '../../components/character-card/character-card';
import { IconBtn } from '../../../../shared/components/icon-btn/icon-btn';
import { ListPopup } from '../../../../shared/components/character-lists/list-popup/list-popup';
import { convertRomajiToJapanese, JapaneseScript } from '../../../../shared/utils/japanese.utils';
import { InViewDirective } from '../../../../shared/directives/in-view.directive';

@Component({
  selector: 'app-character-picker',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputField,
    SegmentedControl,
    ActionBtn,
    CharacterCard,
    SelectField,
    LoadingState,
    ErrorState,
    IconBtn,
    ListPopup,
    InViewDirective,
  ],
  templateUrl: './character-picker.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './character-picker.scss',
})
export class CharacterPicker {
  characterPickerFacadeService = inject(characterPickerFacadeService);

  private readonly pageSize = 20;

  characters = signal<CharacterPickerItem[]>([]);
  totalCount = signal<number>(0);
  isLoading = signal<boolean>(true);
  loadError = signal<string | null>(null);
  hasMore = computed(() => this.characters().length < this.totalCount());

  unicode = new FormControl<string>('');
  literal = new FormControl<string>('');
  characterType = new FormControl<CharacterType>('kanji');
  characterOptions: SegmentedOption<CharacterType>[] = [
    {
      label: 'kana',
      value: 'kana',
    },
    {
      label: 'kanji',
      value: 'kanji',
    },
  ];

  kanaType = new FormControl<kanaType>('all');
  kanaTypeOptions: SegmentedOption<kanaType>[] = [
    {
      label: 'all',
      value: 'all',
    },
    {
      label: 'hiragana',
      value: 'hiragana',
    },
    {
      label: 'katakana',
      value: 'katakana',
    },
  ];
  kanaReading = new FormControl<string>('');

  radicalName = new FormControl<string>('');
  jlptLevel = new FormControl<string>('');
  gradeLevel = new FormControl<string>('');
  sortBy = new FormControl<string>('literal');
  sortOrder = new FormControl<string>('');
  sortByOptions: SegmentedOption<string>[] = [
    { label: 'Literal', value: 'literal' },
    { label: 'Usage', value: 'frequency_of_use' },
    { label: 'JLPT', value: 'jlpt_level' },
    { label: 'Grade', value: 'grade_level' },
  ];
  sortOrderOptions: SegmentedOption<string>[] = [
    { label: 'Default', value: '' },
    { label: 'ASC', value: 'asc' },
    { label: 'DESC', value: 'desc' },
  ];
  jlptLevelOptions: SegmentedOption<string>[] = [
    { label: 'Any', value: '' },
    { label: '1', value: '1' },
    { label: '2', value: '2' },
    { label: '3', value: '3' },
    { label: '4', value: '4' },
  ];
  gradeLevelOptions = [
    { label: 'Any', value: '' },
    ...Array.from({ length: 10 }, (_, i) => ({ label: `g${i + 1}`, value: `g${i + 1}` })),
  ];
  kanjiReading = new FormControl<string>('');
  kanjiMeaning = new FormControl<string>('');
  kanjiNanori = new FormControl<string>('');

  currentPage: number = 1;

  ngOnInit() {
    this.loadCharacters();
  }

  applyFilters = (): void => {
    this.currentPage = 1;
    this.loadCharacters();
  };

  loadMore = (): void => {
    if (this.isLoading() || !this.hasMore()) return;

    this.currentPage += 1;
    this.loadCharacters(true);
  };

  resetFilters = (): void => {
    this.unicode.reset('');
    this.literal.reset('');
    this.characterType.reset('kanji');
    this.kanaType.reset('all');
    this.kanaReading.reset('');
    this.radicalName.reset('');
    this.jlptLevel.reset('');
    this.gradeLevel.reset('');
    this.sortBy.reset('literal');
    this.sortOrder.reset('');
    this.kanjiReading.reset('');
    this.kanjiMeaning.reset('');
    this.kanjiNanori.reset('');
    this.currentPage = 1;

    this.loadCharacters();
  };

  private toKana(value: string | null, script: JapaneseScript = 'hiragana'): string {
    const text = (value ?? '').trim();
    return convertRomajiToJapanese(text, script) || text;
  }

  private loadCharacters(append = false): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    this.characterPickerFacadeService.loadCharacters(this.buildFilters()).subscribe({
      next: (result: CharacterPickerPageResult) => {
        this.characters.update((current) => (append ? [...current, ...result.items] : result.items));
        this.totalCount.set(result.totalCount);
        this.isLoading.set(false);
      },
      error: (err: unknown) => {
        console.error(err);
        if (!append) this.characters.set([]);
        this.totalCount.set(0);
        this.loadError.set('Could not load characters.');
        this.isLoading.set(false);
      },
    });
  }

  buildFilters(): CharacterPickerFilters {
    const script: JapaneseScript = this.kanaType.value === 'katakana' ? 'katakana' : 'hiragana';

    const general: CharacterPickerGeneralFilters = {
      unicode: this.unicode.value as string,
      literal: this.toKana(this.literal.value, script),
    };

    const kana: CharacterPickerKanaFilters = {
      kanaType: this.kanaType.value as kanaType,
      kanaReading: this.kanaReading.value as string,
    };

    const kanji: CharacterPickerKanjiFilters = {
      radicalName: this.radicalName.value as string,
      sortBy: this.sortBy.value as string,
      sortOrder: this.sortOrder.value as 'asc' | 'desc' | undefined,
      jlptLevel: this.jlptLevel.value as string,
      gradeLevel: this.gradeLevel.value as string,
      kanjiReading: this.kanjiReading.value as string,
      kanjiMeaning: this.kanjiMeaning.value as string,
      kanjiNanori: this.kanjiNanori.value as string,
    };

    return {
      type: this.characterType.value as CharacterType,
      general: general,
      kana: kana,
      kanji: kanji,
      page: this.currentPage,
    };
  }
}
