import { Component, computed, inject, signal, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { WritingPractice } from '../../../writing/components/writing-practice/writing-practice';
import { ListService } from '../../../lists/services/list.service';
import { CharacterResult, fromValidation, notAttempted } from '../../utils/stroke-quiz-results';

import {
  QuizMode,
  WritingUiOptions,
  WritingValidationEvent,
} from '../../../../shared/models/quizes/quizes.interface';
import { CharacterType } from '../../../../shared/models/japanese/character.type';
import { getCharacterTypeFromUnicode } from '../../../../shared/models/japanese/character.helper';
import { shuffleCharacters } from '../../../../shared/models/lists/list.model';
import { expandUuid } from '../../../../shared/utils/urls.utils';
import { UnicodeCharacterPipe } from '../../../../shared/pipes/unicode.pipe';
import { ActionBtn } from '../../../../shared/components/action-btn/action-btn';
import { StrokesQuizSummary } from '../../components/stroke-quiz-summary/stroke-quiz-summary';

@Component({
  selector: 'app-strokes-quiz',
  imports: [WritingPractice, UnicodeCharacterPipe, ActionBtn, StrokesQuizSummary],
  templateUrl: './strokes-quiz.html',
  styleUrl: './strokes-quiz.scss',
})
export class StrokesQuiz {
  @ViewChild(WritingPractice)
  private writingPractice?: WritingPractice;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly listService = inject(ListService);

  readonly mode = signal<QuizMode>('practice');
  readonly currentCharacter = signal<string>('');
  readonly type = signal<CharacterType>('kana');
  readonly isFinished = signal(false);

  private readonly characters = signal<string[]>([]);
  private readonly currentIndex = signal(0);
  private readonly results = signal<ReadonlyMap<string, CharacterResult>>(new Map());

  private sourceCharacters: string[] = [];
  private shuffle = false;

  readonly isReady = computed(() => this.characters().length > 0);
  readonly isFirstCharacter = computed(() => this.currentIndex() === 0);
  readonly isLastCharacter = computed(() => this.currentIndex() >= this.characters().length - 1);
  readonly progressLabel = computed(
    () => `${this.currentIndex() + 1} / ${this.characters().length}`,
  );

  /** One result per character, in quiz order; characters never validated come out as not attempted. */
  readonly orderedResults = computed<CharacterResult[]>(() =>
    this.characters().map((unicode) => this.results().get(unicode) ?? notAttempted(unicode)),
  );

  readonly writingUi = computed<Partial<WritingUiOptions>>(() =>
    this.mode() === 'evaluation'
      ? {
          showExpectedPreview: false,
          showValidationResults: false,
          showValidateButton: false,
        }
      : {},
  );

  async ngOnInit(): Promise<void> {
    const mode = this.route.snapshot.paramMap.get('mode');
    const shortListId = this.route.snapshot.paramMap.get('listId');
    const order = this.route.snapshot.queryParamMap.get('order');

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

    const list = await this.listService.getListById(listId);

    if (!list || list.characters.length < 2) {
      console.warn('lista inválida o con menos de 2 caracteres', list);
      return;
    }

    this.sourceCharacters = list.characters;
    this.shuffle = order === 'random';
    this.startSession();
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
    await this.validateIfEvaluating();
    this.isFinished.set(true);
  };

  retry(): void {
    this.startSession();
  }

  async exit(): Promise<void> {
    await this.router.navigate(['/quizes']);
  }

  /** Keeps the latest validation of each character (practice may validate several times). */
  onValidationCompleted(validation: WritingValidationEvent): void {
    this.results.update((results) =>
      new Map(results).set(validation.unicode, fromValidation(validation)),
    );
  }

  /** The Validate button is hidden in evaluation, so advancing has to validate the drawing. */
  private async validateIfEvaluating(): Promise<void> {
    if (this.mode() === 'evaluation') {
      await this.writingPractice?.validate();
    }
  }

  private startSession(): void {
    this.characters.set(
      this.shuffle ? shuffleCharacters(this.sourceCharacters) : [...this.sourceCharacters],
    );
    this.currentIndex.set(0);
    this.results.set(new Map());
    this.isFinished.set(false);
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
  }
}
