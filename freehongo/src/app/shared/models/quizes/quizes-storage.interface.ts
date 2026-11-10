import { StrokeValidationResult } from '../../../features/writing/models/stroke-validation-result.interface';
import { AnswerType, CharacterQuizType } from './quizes.interface';

export type SyncStatus = 'pending' | 'synced' | 'failed';

export interface WritingAttemptResult {
  strokeCountCorrect: boolean;
  orderCorrect: boolean;
  strokeResults: StrokeValidationResult[];
}

export interface StoredQuizSession {
  quizSessionId: string;
  listId: string;
  answerType: AnswerType;
  characterQuizType?: CharacterQuizType;
  startedAt: Date;
  finishedAt: Date;
  totalQuestions: number;
  randomOrder: boolean;
  syncStatus: SyncStatus;
}

export interface StoredQuizAnswer {
  quizSessionId: string;
  unicode: string;
  responseTimeMs: number;
  isCorrect: boolean;
  givenAnswer?: string;
  expectedAnswer?: string;
  confusedWith?: string;
  answeredAt?: Date;
  writingAttempt?: WritingAttemptResult;
}

export interface StoredCharacterStat {
  unicode: string;
  answerType: AnswerType;
  attempts: number;
  totalResponseMs: number;
  correctStreak: number;
  correctCount: number;
  lastSeenAt: Date;
  firstSeenAt: Date;
}
