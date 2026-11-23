import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Card } from '../../../../shared/components/card/card';
import { InputField } from '../../../../shared/components/input/input';
import { ActionBtn } from '../../../../shared/components/action-btn/action-btn';
import {
  SegmentedControl,
  SegmentedOption,
} from '../../../../shared/components/segmented-control/segmented-control';
import { AnswerType, CharacterQuizType } from '../../../../shared/models/quizes/quizes.interface';
import {
  FetchQuizSessionFilters,
  QuizSessionWithList,
} from '../../../../shared/models/quizes/quizes-storage.interface';
import { DashboardFacadeService } from '../../services/dashboard.facade.service';
import { DatePipe } from '@angular/common';
import { CharacterQuizTypePipe } from '../../../../shared/pipes/character-quiz-type.pipe';
import { AnswerTypePipe } from '../../../../shared/pipes/answer-type.pipe';
import { InViewDirective } from '../../../../shared/directives/in-view.directive';
import { Router } from '@angular/router';
import { SelectField } from '../../../../shared/components/select/select';
import { Chip } from '../../../../shared/components/chip/chip';

type AnswerTypeFilter = AnswerType | 'all';
type CharacterQuizTypeFilter = CharacterQuizType | 'all';

const PAGE_SIZE = 20;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Card,
    InputField,
    ActionBtn,
    SegmentedControl,
    DatePipe,
    CharacterQuizTypePipe,
    AnswerTypePipe,
    InViewDirective,
    SelectField,
    Chip,
  ],
  selector: 'app-quiz-history',
  styleUrl: './quiz-history.scss',
  templateUrl: './quiz-history.html',
})
export class QuizHistory {
  private readonly dashboardFacadeService = inject(DashboardFacadeService);
  private readonly router = inject(Router);

  private readonly allSessions = signal<QuizSessionWithList[]>([]);
  private readonly visibleCount = signal(PAGE_SIZE);
  readonly quizSessions = computed(() => this.allSessions().slice(0, this.visibleCount()));
  readonly hasMore = computed(() => this.visibleCount() < this.allSessions().length);

  private readonly viewActions = new Map<string, () => Promise<void>>();

  readonly orderOptions: ReadonlyArray<SegmentedOption<boolean>> = [
    { label: 'Asc', value: false },
    { label: 'Desc', value: true },
  ];

  readonly answerTypeOptions: ReadonlyArray<SegmentedOption<AnswerTypeFilter>> = [
    { label: 'All', value: 'all' },
    { label: 'Multiple', value: 'multiple' },
    { label: 'Open', value: 'open' },
    { label: 'Stroke Writing', value: 'strokeWriting' },
  ];

  readonly characterQuizTypeOptions: ReadonlyArray<SegmentedOption<CharacterQuizTypeFilter>> = [
    { label: 'All', value: 'all' },
    { label: 'Char to Read', value: 'characterToReading' },
    { label: 'Read to Char', value: 'readingToCharacter' },
    { label: 'Char to Mean', value: 'characterToMeaning' },
    { label: 'Mean to Char', value: 'meaningToCharacter' },
  ];

  finishedAt = signal<string>('');
  listName = signal<string>('');
  order = signal<boolean>(true);
  answerType = signal<AnswerTypeFilter>('all');
  characterQuizType = signal<CharacterQuizTypeFilter>('all');

  readonly orderSelectValue = computed(() => String(this.order()));
  readonly orderSelectOptions = this.orderOptions.map((o) => ({
    ...o,
    value: String(o.value),
  }));

  ngOnInit() {
    this.filterQuizes();
  }

  setOrder(value: boolean): void {
    this.order.set(value);
  }

  setAnswerType(value: AnswerTypeFilter): void {
    this.answerType.set(value);
  }

  setCharacterQuizType(value: CharacterQuizTypeFilter): void {
    this.characterQuizType.set(value);
  }

  onAnswerTypeSelect(raw: string): void {
    const option = this.answerTypeOptions.find((o) => String(o.value) === raw);
    if (option) this.setAnswerType(option.value);
  }

  onCharacterQuizTypeSelect(raw: string): void {
    const option = this.characterQuizTypeOptions.find((o) => String(o.value) === raw);
    if (option) this.setCharacterQuizType(option.value);
  }

  onOrderSelect(raw: string): void {
    const option = this.orderOptions.find((o) => String(o.value) === raw);
    if (option) this.setOrder(option.value);
  }

  loadMore(): void {
    if (this.hasMore()) {
      this.visibleCount.update((count) => count + PAGE_SIZE);
    }
  }

  clearFilters = async (): Promise<void> => {
    this.finishedAt.set('');
    this.listName.set('');
    this.answerType.set('all');
    this.characterQuizType.set('all');
    this.order.set(true);
    await this.filterQuizes();
  };

  filterQuizes = async (): Promise<void> => {
    const filters: FetchQuizSessionFilters = {
      descOrder: this.order(),
      listName: this.listName() || undefined,
      finishedAt: this.finishedAt() || undefined,
      answerType: this.answerType() === 'all' ? undefined : (this.answerType() as AnswerType),
      characterQuizType:
        this.characterQuizType() === 'all'
          ? undefined
          : (this.characterQuizType() as CharacterQuizType),
    };

    this.allSessions.set(await this.dashboardFacadeService.fetchQuizSessions(filters));
    this.visibleCount.set(PAGE_SIZE);
  };
  viewAction(sessionId: string): () => Promise<void> {
    let action = this.viewActions.get(sessionId);
    if (!action) {
      action = async () => {
        await this.router.navigate(['/quizzes/details', sessionId]);
      };
      this.viewActions.set(sessionId, action);
    }
    return action;
  }
}
