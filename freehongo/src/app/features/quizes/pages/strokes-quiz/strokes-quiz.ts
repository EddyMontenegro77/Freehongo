import {
  Component,
  computed,
  inject,
  signal,
  ViewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { WritingPractice } from '../../../writing/components/writing-practice/writing-practice';
import { ListService } from '../../../lists/services/list.service';
import { PublicListsFacadeService } from '../../../lists/services/public-lists.facade.service';
import { QuizEvaluationStorageService } from '../../services/quiz-evaluation-storage.service';
import { CharacterResult, fromValidation, notAttempted } from '../../utils/stroke-quiz-results';

import {
  QuizMode,
  WritingAnswerResult,
  WritingQuizResult,
  WritingUiOptions,
  WritingValidationEvent,
  toWritingAttempt,
} from '../../../../shared/models/quizes/quizes.interface';
import { CharacterType } from '../../../../shared/models/japanese/character.type';
import { getCharacterTypeFromUnicode } from '../../../../shared/models/japanese/character.helper';
import { shuffleCharacters } from '../../../../shared/models/lists/list.model';
import { expandUuid } from '../../../../shared/utils/urls.utils';
import { ListSource } from '../../../../shared/models/lists/list.model';
import { nowIso } from '../../../../shared/utils/date.utils';
import { UnicodeCharacterPipe } from '../../../../shared/pipes/unicode.pipe';
import { StrokesQuizSummary } from '../../components/stroke-quiz-summary/stroke-quiz-summary';
import { newId } from '../../../../shared/utils/uuid.utils';
import { Milestone, Progressbar } from '../../../../shared/components/progressbar/progressbar';
import { ActionBtn } from '../../../../shared/components/action-btn/action-btn';

interface RecordedAttempt {
  event: WritingValidationEvent;
  responseTimeMs: number;
  answeredAt: string;
}

@Component({
  selector: 'app-strokes-quiz',
  imports: [WritingPractice, UnicodeCharacterPipe, StrokesQuizSummary, Progressbar, ActionBtn],
  templateUrl: './strokes-quiz.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './strokes-quiz.scss',
})
export class StrokesQuiz {
  @ViewChild(WritingPractice)
  private writingPractice?: WritingPractice;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly listService = inject(ListService);
  private readonly publicListsFacade = inject(PublicListsFacadeService, { optional: true });
  private readonly evaluationStorage = inject(QuizEvaluationStorageService);

  readonly mode = signal<QuizMode>('practice');
  readonly currentCharacter = signal<string>('');
  readonly type = signal<CharacterType>('kana');
  readonly isFinished = signal(false);
  readonly saveFailed = signal(false);

  private readonly characters = signal<string[]>([]);
  private readonly currentIndex = signal(0);
  private readonly results = signal<ReadonlyMap<string, CharacterResult>>(new Map());

  private sourceCharacters: string[] = [];
  private shuffle = false;

  private listId = '';
  private listName = '';
  private startedAt: Date | null = null;
  private characterShownAt = 0;
  private readonly attempts = new Map<string, RecordedAttempt>();

  readonly isReady = computed(() => this.characters().length > 0);
  readonly isFirstCharacter = computed(() => this.currentIndex() === 0);
  readonly isLastCharacter = computed(() => this.currentIndex() >= this.characters().length - 1);
  readonly progressLabel = computed(
    () => `${this.currentIndex() + 1} / ${this.characters().length}`,
  );

  readonly orderedResults = computed<CharacterResult[]>(() =>
    this.characters().map((unicode) => this.results().get(unicode) ?? notAttempted(unicode)),
  );

  readonly progress = computed(() => {
    const total = this.characters().length;

    if (total === 0) return 0;

    // The visible character counts as progress, so the first character starts at 1/total.
    return ((this.currentIndex() + 1) / total) * 100;
  });

  readonly writingUi = computed<Partial<WritingUiOptions>>(() =>
    this.mode() === 'evaluation'
      ? {
          showExpectedPreview: false,
          showValidationResults: false,
          showValidateButton: false,
        }
      : {},
  );

  readonly milestones = computed<Milestone[]>(() => [
    {
      value: 100,
      label: this.mode() === 'evaluation' ? 'Submit evaluation' : 'Finish practice',
    },
  ]);

  async ngOnInit(): Promise<void> {
    const mode = this.route.snapshot.paramMap.get('mode');
    const shortListId = this.route.snapshot.paramMap.get('listId');
    const order = this.route.snapshot.queryParamMap.get('order');
    const quizType = this.route.snapshot.queryParamMap.get('type');
    const source = this.readSource(this.route.snapshot.queryParamMap.get('source'));

    if (mode !== 'practice' && mode !== 'evaluation') {
      console.warn('mode inválido', mode);
      return;
    }
    this.mode.set(mode);

    if (!shortListId) {
      console.warn('sin listId');
      return;
    }

    let listId: string;
    try {
      listId = expandUuid(shortListId);
    } catch {
      console.warn('listId inválido', shortListId);
      return;
    }

    const list = await this.loadList(listId, source);

    if (!list || list.characters.length < 2) {
      console.warn('lista inválida o con menos de 2 caracteres', list);
      return;
    }

    this.listId = listId;
    this.listName = list.name;
    this.sourceCharacters = list.characters;
    this.shuffle = order === 'random';
    this.startSession();
  }

  private readSource(value: string | null): ListSource {
    return value === 'public' || value === 'official' ? value : 'private';
  }

  private loadList(listId: string, source: ListSource) {
    if (source === 'private') return this.listService.getListById(listId);
    if (!this.publicListsFacade) return Promise.resolve(undefined);
    return this.publicListsFacade.getListById(source, listId);
  }

  previousCharacter = (): void => {
    if (this.mode() === 'evaluation' || this.isFirstCharacter()) {
      return;
    }

    this.currentIndex.update((index) => index - 1);
    this.setCurrentCharacter();
    this.writingPractice?.reset();
  };

  nextCharacter = async (): Promise<void> => {
    if (this.isLastCharacter()) {
      return;
    }

    await this.validateIfEvaluating();
    this.currentIndex.update((index) => index + 1);
    this.setCurrentCharacter();
    this.writingPractice?.reset();
  };

  finish = async (): Promise<void> => {
    if (this.isFinished()) {
      return;
    }

    await this.validateIfEvaluating();
    this.isFinished.set(true);
    await this.saveEvaluation();
  };

  retry(): void {
    this.startSession();
  }

  async exit(): Promise<void> {
    await this.router.navigate(['/quizzes']);
  }

  onValidationCompleted(validation: WritingValidationEvent): void {
    this.results.update((results) =>
      new Map(results).set(validation.unicode, fromValidation(validation)),
    );

    this.attempts.set(validation.unicode, {
      event: validation,
      responseTimeMs: Math.max(0, Date.now() - this.characterShownAt),
      answeredAt: nowIso(),
    });
  }

  private async validateIfEvaluating(): Promise<void> {
    if (this.mode() === 'evaluation') {
      await this.writingPractice?.validate();
    }
  }

  private async saveEvaluation(): Promise<void> {
    if (this.mode() !== 'evaluation' || !this.startedAt) {
      return;
    }

    const answers = this.characters().flatMap((unicode): WritingAnswerResult[] => {
      const attempt = this.attempts.get(unicode);

      if (!attempt) {
        return [];
      }

      return [
        {
          characterUnicode: unicode,
          expectedAnswer: unicode,
          correct: attempt.event.isValid,
          responseTimeMs: attempt.responseTimeMs,
          answeredAt: attempt.answeredAt,
          writing: toWritingAttempt(attempt.event, attempt.event.strokeResults.length),
        },
      ];
    });

    const result: WritingQuizResult = {
      id: newId(),
      listId: this.listId,
      listName: this.listName,
      order: this.shuffle ? 'random' : 'list',
      startedAt: this.startedAt.toISOString(),
      completedAt: nowIso(),
      score: answers.filter((answer) => answer.correct).length,
      total: answers.length,
      answerType: 'strokeWriting',
      answers,
    };

    try {
      await this.evaluationStorage.saveEvaluation(result);
    } catch (error) {
      console.error('Could not save the quiz evaluation', error);
      this.saveFailed.set(true);
    }
  }

  private startSession(): void {
    this.characters.set(
      this.shuffle ? shuffleCharacters(this.sourceCharacters) : [...this.sourceCharacters],
    );
    this.currentIndex.set(0);
    this.results.set(new Map());
    this.attempts.clear();
    this.isFinished.set(false);
    this.saveFailed.set(false);
    this.startedAt = new Date();
    this.setCurrentCharacter();
  }

  private setCurrentCharacter(): void {
    const character = this.characters()[this.currentIndex()];

    if (!character) {
      return;
    }

    const type = getCharacterTypeFromUnicode(character);

    if (type === 'unknown') {
      console.error(`Unknown character type for: ${character}`);
      return;
    }

    this.currentCharacter.set(character);
    this.type.set(type);
    this.characterShownAt = Date.now();
  }
}
