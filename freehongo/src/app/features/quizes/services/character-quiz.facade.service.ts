import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { toHiragana, toKana } from 'wanakana';
import { JapaneseService } from '../../../shared/services/japanese/japanese.service';
import { Character } from '../../../shared/models/japanese/character.model';
import { getCharacterTypeFromUnicode } from '../../../shared/models/japanese/character.helper';
import {
  QuizAnswerResult,
  CharacterQuizConfig,
  CharacterQuizQuestion,
} from '../../../shared/models/quizes/quizes.interface';
import { ListsFacade } from '../../lists/services/lists.facade.service';
import { QuizQuestionService } from './quiz-question.service';
import { QuizEvaluationStorageService } from './quiz-evaluation-storage.service';

const MIN_CHARACTERS_AMOUNT = 2;
const SUPPORTED_ANSWER_TYPES: readonly string[] = ['multiple', 'open', 'strokeWriting'];

// ─────────────────────────────────────────────────────────────
// Pure helpers
// ─────────────────────────────────────────────────────────────

function assertSupportedAnswerType(config: CharacterQuizConfig): void {
  if (!SUPPORTED_ANSWER_TYPES.includes(config.answerType)) {
    throw new Error('This quiz answer type is not implemented.');
  }
}

function assertEnoughCharacters(unicodes: string[]): void {
  if (unicodes.length < MIN_CHARACTERS_AMOUNT) {
    throw new Error(`A quiz list must contain at least ${MIN_CHARACTERS_AMOUNT} characters.`);
  }
}

function isAnswerCorrect(answer: string, question: CharacterQuizQuestion): boolean {
  return question.acceptedAnswers.some((accepted) => answersMatch(answer, accepted));
}

/** Compares an answer using the format expected by the question. */
function answersMatch(answer: string, expectedAnswer: string): boolean {
  return (
    normalizeAnswer(answer, expectedAnswer) === normalizeAnswer(expectedAnswer, expectedAnswer)
  );
}

/**
 * Normalizes Japanese readings to hiragana so kana and romaji answers match.
 * Other answers, such as English meanings or kanji, remain plain text.
 */
function normalizeAnswer(answer: string, expectedAnswer: string): string {
  const normalized = katakanaToHiragana(answer.trim().normalize('NFKC').toLocaleLowerCase());

  if (isJapaneseReading(expectedAnswer)) {
    return toHiragana(toKana(normalized));
  }

  return normalized.replace(/\s+/g, ' ');
}

function katakanaToHiragana(text: string): string {
  return Array.from(text)
    .map((character) => {
      const codePoint = character.codePointAt(0) ?? 0;

      return codePoint >= 0x30a1 && codePoint <= 0x30f6
        ? String.fromCodePoint(codePoint - 0x60)
        : character;
    })
    .join('');
}

function isJapaneseReading(value: string): boolean {
  return /^[\u3040-\u30ffー・.\s]+$/u.test(value);
}

// ─────────────────────────────────────────────────────────────
// Facade
// ─────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class CharacterQuizFacade {
  private readonly listsFacade = inject(ListsFacade);
  private readonly japaneseService = inject(JapaneseService);
  private readonly questionService = inject(QuizQuestionService);
  private readonly evaluationStorage = inject(QuizEvaluationStorageService);

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly emptyList = signal(false);
  readonly questions = signal<CharacterQuizQuestion[]>([]);
  readonly currentIndex = signal(0);
  readonly score = signal(0);
  readonly hasAnswered = signal(false);
  readonly lastAnswerCorrect = signal<boolean | null>(null);
  readonly isFinished = signal(false);
  readonly answers = signal<QuizAnswerResult[]>([]);
  private activeConfig: CharacterQuizConfig | null = null;
  private startedAt: Date | null = null;

  /** Returns the question currently being displayed, if the quiz has started. */
  currentQuestion = (): CharacterQuizQuestion | undefined => this.questions()[this.currentIndex()];

  // ── Public API ──────────────────────────────────────────────

  /**
   * Loads the list, resolves character details and creates the quiz questions.
   * A list needs at least two characters to provide meaningful distractors.
   */
  async load(config: CharacterQuizConfig): Promise<void> {
    this.beginLoading(config);

    try {
      assertSupportedAnswerType(config);

      const list = await this.listsFacade.getListById(config.listId);

      if (!list || list.characters.length === 0) {
        this.emptyList.set(true);
        return;
      }

      assertEnoughCharacters(list.characters);

      const characters = await this.loadCharacters(list.characters);
      this.questions.set(this.buildQuestions(characters, config));
    } catch (error) {
      console.error(error);
      this.error.set(error instanceof Error ? error.message : 'Could not load the quiz.');
    } finally {
      this.isLoading.set(false);
    }
  }

  /** Records one answer and compares it after normalizing its format. */
  submitAnswer(answer: string): void {
    const question = this.currentQuestion();

    if (!question || this.hasAnswered()) {
      return;
    }

    this.registerAnswer(question, answer, isAnswerCorrect(answer, question));
  }

  /** Advances after an answer and persists the session when it finishes. */
  nextQuestion(): void {
    if (!this.hasAnswered()) {
      return;
    }

    if (this.isLastQuestion()) {
      this.finishQuiz();
      return;
    }

    this.goToNextQuestion();
  }

  /** Clears transient state so a retry starts a fresh quiz session. */
  resetSession(): void {
    this.questions.set([]);
    this.currentIndex.set(0);
    this.score.set(0);
    this.hasAnswered.set(false);
    this.lastAnswerCorrect.set(null);
    this.answers.set([]);
    this.isFinished.set(false);
  }

  dismissEmptyList = (): void => {
    this.emptyList.set(false);
  };

  // ── Loading ─────────────────────────────────────────────────

  private beginLoading(config: CharacterQuizConfig): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.emptyList.set(false);
    this.resetSession();
    this.activeConfig = config;
    this.startedAt = new Date();
  }

  private buildQuestions(
    characters: Character[],
    config: CharacterQuizConfig,
  ): CharacterQuizQuestion[] {
    const questions = this.questionService.createQuestions(
      characters,
      config.characterQuizType,
      config.order,
    );

    if (questions.length === 0) {
      throw new Error('No questions could be generated for this list.');
    }

    return questions;
  }

  /** Resolves list unicode values into the character data used by questions. */
  private loadCharacters(unicodes: string[]): Promise<Character[]> {
    return Promise.all(unicodes.map((unicode) => this.loadCharacter(unicode)));
  }

  private async loadCharacter(unicode: string): Promise<Character> {
    const type = getCharacterTypeFromUnicode(unicode);

    if (type === 'kana') {
      return {
        ...(await firstValueFrom(this.japaneseService.getKana(unicode))),
        kind: 'kana' as const,
      };
    }

    if (type === 'kanji') {
      return {
        ...(await firstValueFrom(this.japaneseService.getKanji(unicode))),
        kind: 'kanji' as const,
      };
    }

    throw new Error(`Unsupported character unicode: ${unicode}`);
  }

  // ── Answering and progress ──────────────────────────────────

  private registerAnswer(question: CharacterQuizQuestion, answer: string, correct: boolean): void {
    this.hasAnswered.set(true);
    this.lastAnswerCorrect.set(correct);
    this.answers.update((answers) => [
      ...answers,
      { characterUnicode: question.characterUnicode, answer, correct },
    ]);

    if (correct) {
      this.score.update((score) => score + 1);
    }
  }

  private isLastQuestion(): boolean {
    return this.currentIndex() >= this.questions().length - 1;
  }

  private goToNextQuestion(): void {
    this.currentIndex.update((index) => index + 1);
    this.hasAnswered.set(false);
    this.lastAnswerCorrect.set(null);
  }

  private finishQuiz(): void {
    this.isFinished.set(true);
    this.saveEvaluation();
  }

  // ── Persistence ─────────────────────────────────────────────

  /** Persists results only in evaluation mode; practice remains transient. */
  private saveEvaluation(): void {
    if (this.activeConfig?.mode !== 'evaluation' || !this.startedAt) {
      return;
    }

    this.evaluationStorage.save(this.buildEvaluation(this.activeConfig, this.startedAt));
  }

  private buildEvaluation(config: CharacterQuizConfig, startedAt: Date) {
    return {
      id: crypto.randomUUID(),
      listId: config.listId,
      characterQuizType: config.characterQuizType,
      answerType: config.answerType,
      order: config.order,
      startedAt: startedAt.toISOString(),
      completedAt: new Date().toISOString(),
      score: this.score(),
      total: this.questions().length,
      answers: this.answers(),
    };
  }
}
