import { Component, signal } from '@angular/core';
import { PaginationController } from '../../../../shared/components/pagination-controller/pagination-controller';
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
  CharacterPickerKanaFilters,
  CharacterPickerKanjiFilters,
} from '../../services/character-picker.facade.service';
import { ActionBtn } from '../../../../shared/components/action-btn/action-btn';
import { CharacterCard } from '../../components/character-card/character-card';

@Component({
  selector: 'app-character-picker',
  standalone: true,
  imports: [
    PaginationController,
    ReactiveFormsModule,
    InputField,
    SegmentedControl,
    ActionBtn,
    CharacterCard,
    SelectField,
    LoadingState,
    ErrorState,
  ],
  templateUrl: './character-picker.html',
  styleUrl: './character-picker.scss',
})
export class CharacterPicker {
  constructor(private characterPickerFacadeService: characterPickerFacadeService) {}

  characters = signal<CharacterPickerItem[]>([]);
  isLoading = signal<boolean>(true);
  loadError = signal<string | null>(null);

  // General filters
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

  // Kana filters
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

  // Kanji filters
  radicalName = new FormControl<string>('');
  jlptLevel = new FormControl<string>('');
  gradeLevel = new FormControl<string>('');
  sortBy = new FormControl<string>('literal');
  sortByOptions: SegmentedOption<string>[] = [
    { label: 'Literal', value: 'literal' },
    { label: 'Frequency', value: 'frequency_of_use' },
    { label: 'JLPT', value: 'jlpt_level' },
    { label: 'Grade', value: 'grade_level' },
  ];
  jlptLevelOptions: SegmentedOption<string>[] = [
    { label: '1', value: '1' },
    { label: '2', value: '2' },
    { label: '3', value: '3' },
    { label: '4', value: '4' },
  ];
  gradeLevelOptions = Array.from({ length: 10 }, (_, index) => {
    const level = index + 1;
    return { label: `g${level}`, value: `g${level}` };
  });
  kanjiReading = new FormControl<string>('');
  kanjiMeaning = new FormControl<string>('');
  kanjiNanori = new FormControl<string>('');

  currentPage: number = 1;
  totalPages: number = 1;

  loadPage(page: number) {
    this.currentPage = page;
    this.loadCharacters();
  }

  ngOnInit() {
    this.loadCharacters();
  }

  applyFilters = (): void => {
    this.loadCharacters();
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
    this.kanjiReading.reset('');
    this.kanjiMeaning.reset('');
    this.kanjiNanori.reset('');
    this.currentPage = 1;

    this.loadCharacters();
  };

  private loadCharacters(): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    this.characterPickerFacadeService.loadCharacters(this.buildFilters()).subscribe({
      next: (characters) => {
        this.characters.set(characters);
        this.isLoading.set(false);
      },
      error: (err: unknown) => {
        console.error(err);
        this.characters.set([]);
        this.loadError.set('Could not load characters.');
        this.isLoading.set(false);
      },
    });
  }

  buildFilters(): CharacterPickerFilters {
    const general: CharacterPickerGeneralFilters = {
      unicode: this.unicode.value as string,
      literal: this.literal.value as string,
    };

    const kana: CharacterPickerKanaFilters = {
      kanaType: this.kanaType.value as kanaType,
      kanaReading: this.kanaReading.value as string,
    };

    const kanji: CharacterPickerKanjiFilters = {
      radicalName: this.radicalName.value as string,
      sortBy: this.sortBy.value as string,
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
