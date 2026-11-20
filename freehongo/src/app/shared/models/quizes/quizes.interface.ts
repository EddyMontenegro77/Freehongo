import { StrokeValidationResult } from '../../../features/writing/models/stroke-validation-result.interface';
import { ListSource } from '../lists/list.model';

export type CharacterQuizType =
  | 'characterToReading'
  | 'readingToCharacter'
  | 'characterToMeaning'
  | 'meaningToCharacter';

export interface QuizOption {
  value: string;
  label: string;
}

export type AnswerType = 'multiple' | 'open' | 'strokeWriting';
export type QuizMode = 'practice' | 'evaluation';
export type QuizOrder = 'random' | 'list';

export interface QuizSettings {
  characterQuizType: CharacterQuizType;
  answerType: AnswerType;
  mode: QuizMode;
  order: QuizOrder;
}

export interface CharacterQuizConfig extends QuizSettings {
  listId: string;
  source?: ListSource;
}

export interface CharacterQuizQuestion {
  prompt: string;
  acceptedAnswers: string[];
  characterUnicode: string;
  options?: QuizOption[];
}

// ---------- Writing ----------

export interface WritingAttemptResult {
  strokeCountCorrect: boolean;
  orderCorrect: boolean;
  strokeResults: StrokeValidationResult[];
}

/** UI Event: Emitted by writing component. Not saved. */
export interface WritingValidationEvent {
  unicode: string;
  isValid: boolean;
  sequenceError: string;
  strokeResults: StrokeValidationResult[];
}

/** Converts UI event in what is intended to be saved. Call where expected strokes number is known*/
export function toWritingAttempt(
  e: WritingValidationEvent,
  expectedStrokeCount: number,
): WritingAttemptResult {
  return {
    strokeCountCorrect: e.strokeResults.length === expectedStrokeCount,
    orderCorrect: e.sequenceError === '',
    strokeResults: e.strokeResults,
  };
}

export interface WritingUiOptions {
  showExpectedPreview: boolean;
  showValidationResults: boolean;
  showValidateButton: boolean;
}

export const DEFAULT_WRITING_UI: WritingUiOptions = {
  showExpectedPreview: true,
  showValidationResults: true,
  showValidateButton: true,
};

// ---------- Answers ----------

interface BaseAnswerResult {
  characterUnicode: string;
  expectedAnswer: string;
  correct: boolean;
  responseTimeMs: number;
  answeredAt: string; // ISO
}

export interface ChoiceAnswerResult extends BaseAnswerResult {
  answer: string;
  confusedWith?: string;
}

export interface WritingAnswerResult extends BaseAnswerResult {
  writing: WritingAttemptResult;
}

// ---------- Eval results ----------

interface BaseQuizResult {
  id: string;
  listId: string;
  order: QuizOrder;
  startedAt: string; // ISO
  completedAt: string; // ISO
  score: number;
  total: number;
}

export interface ChoiceQuizResult extends BaseQuizResult {
  answerType: 'multiple' | 'open';
  characterQuizType: CharacterQuizType;
  answers: ChoiceAnswerResult[];
}

export interface WritingQuizResult extends BaseQuizResult {
  answerType: 'strokeWriting';
  answers: WritingAnswerResult[];
}

export type QuizEvaluationResult = ChoiceQuizResult | WritingQuizResult;
