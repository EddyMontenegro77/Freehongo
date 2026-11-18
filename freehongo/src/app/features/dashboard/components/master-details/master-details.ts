import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
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
import { DatePipe, DecimalPipe } from '@angular/common';
import { Card } from '../../../../shared/components/card/card';
import { RouterLink } from '@angular/router';

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

@Component({
  imports: [
    AnswerTypePipe,
    UnicodeCharacterPipe,
    InputField,
    SegmentedControl,
    DecimalPipe,
    DatePipe,
    InViewDirective,
    Card,
    RouterLink,
  ],
  selector: 'app-master-details',
  styleUrl: './master-details.scss',
  templateUrl: './master-details.html',
})
export class MasterDetails {
  private readonly facade = inject(DashboardFacadeService);

  readonly data = input.required<PracticedCharacter[]>();

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
    const term = this.search().trim().toLowerCase();
    const category = this.category();

    return this.data()
      .filter((c) => {
        if (category !== 'all' && categoryOf(c.unicode) !== category) return false;
        if (!term) return true;
        return (
          unicodeChar.transform(c.unicode).includes(term) || c.unicode.toLowerCase().includes(term)
        );
      })
      .sort(SORTERS[this.sortBy()]);
  });

  readonly visibleCharacters = computed(() => this.filtered().slice(0, this.visibleCount()));
  readonly hasMore = computed(() => this.visibleCount() < this.filtered().length);

  protected readonly categoryOf = categoryOf;
  protected readonly levelOf = levelOf;
  protected readonly kanaOrKanji = kanaOrKanji;

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

  protected strokeColor(rate: number): string {
    return `hsl(${Math.round(rate * 120)}, 60%, 42%)`;
  }
}
