import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { categoryOf, kanaOrKanji, levelOf } from '../../utils/dashboard.utils';
import {
  CharacterDetail,
  DashboardCategory,
  PracticedCharacter,
} from '../../models/dashboard.models';
import { UnicodeCharacterPipe } from '../../../../shared/pipes/unicode.pipe';
import { DashboardFacadeService } from '../../services/dashboard.facade.service';
import {
  SegmentedOption,
  SegmentedControl,
} from '../../../../shared/components/segmented-control/segmented-control';
import { AnswerTypePipe } from '../../../../shared/pipes/answer-type.pipe';
import { InputField } from '../../../../shared/components/input/input';
import { InViewDirective } from '../../../../shared/directives/in-view.directive';
import { DatePipe, DecimalPipe, TitleCasePipe } from '@angular/common';
import { Card } from '../../../../shared/components/card/card';
import { RouterLink } from '@angular/router';
import { Modal } from '../../../../shared/components/modal/modal';
import { SelectField } from '../../../../shared/components/select/select';
import { IconBtn } from '../../../../shared/components/icon-btn/icon-btn';
import { Progressbar } from '../../../../shared/components/progressbar/progressbar';
import { Chip } from '../../../../shared/components/chip/chip';
import { ActionBtn } from '../../../../shared/components/action-btn/action-btn';
import { convertRomajiToJapanese } from '../../../../shared/utils/japanese.utils';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';

export const LEVEL_CRITERIA = [
  { label: 'New', description: 'Little or no practice yet.' },
  { label: 'Beginner', description: 'You have started practicing, but the score is still low.' },
  { label: 'Intermediate', description: 'Mostly correct answers with a fair amount of practice.' },
  { label: 'Mastered', description: 'High accuracy sustained over enough attempts.' },
] as const;

type CategoryFilter = DashboardCategory | 'all';
type SortKey = 'masteryAsc' | 'masteryDesc' | 'attempts' | 'recent';

const PAGE_SIZE = 30;
const unicodeChar = new UnicodeCharacterPipe();

const SORTERS: Record<SortKey, (a: PracticedCharacter, b: PracticedCharacter) => number> = {
  masteryAsc: (a, b) => a.masteryScore - b.masteryScore || b.attempts - a.attempts,
  masteryDesc: (a, b) => b.masteryScore - a.masteryScore || b.attempts - a.attempts,
  attempts: (a, b) => b.attempts - a.attempts,
  recent: (a, b) => b.lastSeenAt.getTime() - a.lastSeenAt.getTime(),
};

const STROKE_OK_THRESHOLD = 0.7;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AnswerTypePipe,
    UnicodeCharacterPipe,
    InputField,
    SegmentedControl,
    DatePipe,
    InViewDirective,
    RouterLink,
    SelectField,
    IconBtn,
    Progressbar,
    Chip,
    Modal,
    ActionBtn,
    TitleCasePipe,
  ],
  selector: 'app-master-details',
  styleUrl: './master-details.scss',
  templateUrl: './master-details.html',
})
export class MasterDetails {
  private readonly facade = inject(DashboardFacadeService);

  readonly data = input.required<PracticedCharacter[]>();

  readonly criteria = LEVEL_CRITERIA;

  readonly categoryOptions: ReadonlyArray<SegmentedOption<CategoryFilter>> = [
    { label: 'All', value: 'all' },
    { label: 'Hiragana', value: 'hiragana' },
    { label: 'Katakana', value: 'katakana' },
    { label: 'Kanji', value: 'kanji' },
  ];

  readonly sortOptions: ReadonlyArray<SegmentedOption<SortKey>> = [
    { label: 'Weakest', value: 'masteryAsc' },
    { label: 'Strongest', value: 'masteryDesc' },
    { label: 'Most practiced', value: 'attempts' },
    { label: 'Recent', value: 'recent' },
  ];

  readonly search = signal('');
  readonly category = signal<CategoryFilter>('all');
  readonly sortBy = signal<SortKey>('masteryAsc');

  readonly selected = signal<string | null>(null);
  readonly detail = signal<CharacterDetail | null>(null);
  readonly detailLoading = signal(false);

  private readonly visibleCount = signal(PAGE_SIZE);
  private loadToken = 0;

  readonly filtered = computed(() => {
    const { raw, kana } = this.searchTerm();
    const category = this.category();

    return this.data()
      .filter((c) => {
        if (category !== 'all' && categoryOf(c.unicode) !== category) return false;
        if (!raw) return true;

        const char = unicodeChar.transform(c.unicode);
        return (
          char.includes(raw) ||
          kana.some((k) => char.includes(k)) ||
          c.unicode.toLowerCase().includes(raw)
        );
      })
      .sort(SORTERS[this.sortBy()]);
  });

  readonly visibleCharacters = computed(() => this.filtered().slice(0, this.visibleCount()));
  readonly hasMore = computed(() => this.visibleCount() < this.filtered().length);

  protected readonly categoryOf = categoryOf;
  protected readonly levelOf = levelOf;
  protected readonly kanaOrKanji = kanaOrKanji;

  infoModal = viewChild<Modal>('infoModal');

  constructor() {
    effect(() => {
      this.filtered();
      untracked(() => this.visibleCount.set(PAGE_SIZE));
    });

    effect(() => {
      const first = this.filtered()[0];
      untracked(() => {
        if (!this.selected() && first) this.select(first.unicode);
      });
    });
  }

  openModal = (): void => this.infoModal()?.open();
  closeModal = (): void => this.infoModal()?.close();

  onCategorySelect(raw: string): void {
    const option = this.categoryOptions.find((o) => o.value === raw);
    if (option) this.category.set(option.value);
  }

  onSortSelect(raw: string): void {
    const option = this.sortOptions.find((o) => o.value === raw);
    if (option) this.sortBy.set(option.value);
  }

  loadMore(): void {
    if (this.hasMore()) this.visibleCount.update((n) => n + PAGE_SIZE);
  }

  async select(unicode: string | null): Promise<void> {
    this.selected.set(unicode);
    const token = ++this.loadToken;

    if (!unicode) {
      this.detail.set(null);
      return;
    }

    this.detailLoading.set(true);
    const detail = await this.facade.getCharacterDetail(unicode);
    if (token !== this.loadToken) return;

    this.detail.set(detail);
    this.detailLoading.set(false);
  }

  protected pct(rate: number): number {
    return Math.round(rate * 100);
  }

  protected accuracy(correct: number, attempts: number): number {
    return attempts ? Math.round((correct / attempts) * 100) : 0;
  }

  protected strokeClass(rate: number | null | undefined): string {
    if (rate == null || Number.isNaN(rate)) return 'stroke-empty';
    return rate >= STROKE_OK_THRESHOLD ? 'stroke-success' : 'stroke-danger';
  }

  private readonly searchTerm = toSignal(
    toObservable(this.search).pipe(
      debounceTime(300),
      map((value) => value.trim().toLowerCase()),
      distinctUntilChanged(),
      map((raw) => ({
        raw,
        kana: [
          convertRomajiToJapanese(raw, 'hiragana'),
          convertRomajiToJapanese(raw, 'katakana'),
        ].filter(Boolean),
      })),
    ),
    { initialValue: { raw: '', kana: [] as string[] } },
  );
}
