import { StrokeValidationResult } from '../../../features/writing/models/stroke-validation-result.interface';

export type CharacterQuizType =
  | 'characterToReading'
  | 'readingToCharacter'
  | 'characterToMeaning'
  | 'meaningToCharacter';

export interface QuizOption {
  value: string;
  label: string;
}

export type AnswerType = 'multiple' | 'open' | 'flashcard' | 'keyBoardWriting' | 'strokeWriting';
export type QuizMode = 'practice' | 'evaluation';
export type QuizOrder = 'random' | 'list';

export type ImplementedAnswerType = Extract<AnswerType, 'multiple' | 'open' | 'strokeWriting'>;

export interface QuizSettings {
  characterQuizType: CharacterQuizType;
  answerType: ImplementedAnswerType;
  mode: QuizMode;
  order: QuizOrder;
}

export interface CharacterQuizConfig extends QuizSettings {
  listId: string;
}

export interface CharacterQuizQuestion {
  prompt: string;
  acceptedAnswers: string[];
  characterUnicode: string;
  options?: QuizOption[];
}

export interface QuizAnswerResult {
  characterUnicode: string;
  answer: string;
  correct: boolean;
}

export interface QuizEvaluationResult {
  id: string;
  listId: string;
  characterQuizType: CharacterQuizType;
  answerType: AnswerType;
  order: QuizOrder;
  startedAt: string;
  completedAt: string;
  score: number;
  total: number;
  answers: QuizAnswerResult[];
}

export interface WritingValidationEvent {
  unicode: string;
  isValid: boolean;
  sequenceError: string;
  strokeResults: StrokeValidationResult[];
}

export interface WritingUiOptions {
  showExpectedPreview: boolean;
  showValidationResults: boolean;
  showUndoRedo: boolean;
  showReset: boolean;
}

export const DEFAULT_WRITING_UI: WritingUiOptions = {
  showExpectedPreview: true,
  showValidationResults: true,
  showUndoRedo: true,
  showReset: true,
};
