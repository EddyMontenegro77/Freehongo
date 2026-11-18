export interface SyncResult {
  total: number;
  synced: number;
  failed: number;
  errors: Array<{
    id: string;
    error: unknown;
  }>;
  aborted?: boolean;
}

export interface PullResult {
  fetched: number;
  inserted: number;
  updated: number;
  removed: number;
  failed: number;
  errors: Array<{
    id: string;
    error: unknown;
  }>;
}

export interface SyncPushOptions {
  includeFailed?: boolean;
}

export interface FullSyncResult {
  lists: SyncResult;
  quizzes: SyncResult;
  pulled: { lists: PullResult; quizzes: PullResult } | null;
  total: number;
  synced: number;
  failed: number;
}

export interface ListInfoDto {
  listId: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  listType: string;
  charUnicodes: string[];
}

export interface ListsGroupDto {
  lists: ListInfoDto[];
}

export interface SubmitQuizRequest {
  quizSessionId: string;
  listId: string;
  answerType: string;
  characterQuizType?: string | null;
  startedAt: string;
  finishedAt: string;
  randomOrder: boolean;
  answers: QuizAnswerRequest[];
}

export interface QuizAnswerRequest {
  unicode: string;
  responseTimeMs: number;
  isCorrect: boolean;
  givenAnswer?: string | null;
  expectedAnswer?: string | null;
  confusedWith?: string | null;
  answeredAt?: string | null;
  writing?: {
    strokeCountCorrect: boolean;
    orderCorrect: boolean;
    strokeResults: unknown;
  } | null;
}

export interface RemoteQuizSessionSummaryDto {
  quizSessionId: string;
  listId: string;
  listName: string | null;
  answerType: string;
  characterQuizType: string | null;
  startedAt: string;
  finishedAt: string;
  totalQuestions: number;
  randomOrder: boolean;
  correctCount: number;
  avgResponseMs: number;
}

export interface RemoteQuizSessionsGroupDto {
  sessions: RemoteQuizSessionSummaryDto[];
}

export interface RemoteQuizAnswerDto {
  unicode: string;
  responseTimeMs: number;
  isCorrect: boolean;
  givenAnswer: string | null;
  expectedAnswer: string | null;
  confusedWith: string | null;
  answeredAt: string | null;
  writing: {
    strokeCountCorrect: boolean;
    orderCorrect: boolean;
    strokeResults: unknown;
  } | null;
}

export interface RemoteQuizSessionDetailDto extends RemoteQuizSessionSummaryDto {
  answers: RemoteQuizAnswerDto[];
}
