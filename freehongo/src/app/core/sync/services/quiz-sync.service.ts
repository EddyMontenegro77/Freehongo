import { inject, Service } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../../environments/environments';
import { DatabaseService } from '../../db/services/database.service';
import {
  StoredQuizAnswer,
  StoredQuizSession,
} from '../../../shared/models/quizes/quizes-storage.interface';
import { AnswerType, CharacterQuizType } from '../../../shared/models/quizes/quizes.interface';
import { StrokeValidationResult } from '../../../features/writing/models/stroke-validation-result.interface';
import {
  PullResult,
  QuizAnswerRequest,
  RemoteQuizAnswerDto,
  RemoteQuizSessionDetailDto,
  RemoteQuizSessionsGroupDto,
  RemoteQuizSessionSummaryDto,
  SubmitQuizRequest,
  SyncPushOptions,
  SyncResult,
} from '../models/sync.models';
import {
  classifyError,
  emptyPullResult,
  fetchAllPages,
  mapWithConcurrency,
  toIsoString,
  toTime,
} from '../sync.utils';

const MIN_ANSWERS = 2;
const MAX_ANSWERS = 500;
const DETAIL_CONCURRENCY = 4;

@Service()
export class QuizSyncService {
  private readonly http = inject(HttpClient);
  private readonly databaseService = inject(DatabaseService);

  private get database() {
    return this.databaseService.database;
  }

  async syncPending(options: SyncPushOptions = {}): Promise<SyncResult> {
    const db = this.database;
    const statuses = options.includeFailed ? ['pending', 'failed'] : ['pending'];
    const pending = await db.quizSessions.where('syncStatus').anyOf(statuses).toArray();

    const result: SyncResult = { total: pending.length, synced: 0, failed: 0, errors: [] };

    for (const session of pending) {
      if (!db.isOpen()) {
        result.aborted = true;
        break;
      }

      try {
        await this.syncSession(session);
        await db.quizSessions.update(session.quizSessionId, { syncStatus: 'synced' });
        result.synced++;
      } catch (error) {
        const kind = classifyError(error);

        if (kind === 'permanent') {
          await db.quizSessions.update(session.quizSessionId, { syncStatus: 'failed' });
        }

        result.failed++;
        result.errors.push({ id: session.quizSessionId, error });

        if (kind === 'abort') {
          result.aborted = true;
          break;
        }
      }
    }

    return result;
  }

  private async syncSession(session: StoredQuizSession): Promise<void> {
    const answers = await this.database.quizAnswers
      .where('quizSessionId')
      .equals(session.quizSessionId)
      .toArray();

    if (answers.length < MIN_ANSWERS || answers.length > MAX_ANSWERS) {
      throw new Error(
        `Session ${session.quizSessionId} has ${answers.length} answers (allowed ${MIN_ANSWERS}-${MAX_ANSWERS}).`,
      );
    }

    const request = this.toSubmitRequest(session, answers);
    await firstValueFrom(this.http.post<void>(`${environment.apiUrl}/quizes/submit`, request));
  }

  private toSubmitRequest(
    session: StoredQuizSession,
    answers: StoredQuizAnswer[],
  ): SubmitQuizRequest {
    const ordered = [...answers].sort((a, b) => toTime(a.answeredAt) - toTime(b.answeredAt));

    return {
      quizSessionId: session.quizSessionId,
      listId: session.listId,
      answerType: session.answerType,
      characterQuizType: session.characterQuizType ?? null,
      startedAt: toIsoString(session.startedAt),
      finishedAt: toIsoString(session.finishedAt),
      randomOrder: session.randomOrder,
      answers: ordered.map((answer) => this.toAnswerRequest(answer)),
    };
  }

  private toAnswerRequest(answer: StoredQuizAnswer): QuizAnswerRequest {
    const request: QuizAnswerRequest = {
      unicode: answer.unicode,
      responseTimeMs: answer.responseTimeMs,
      isCorrect: answer.isCorrect,
      givenAnswer: answer.givenAnswer ?? null,
      expectedAnswer: answer.expectedAnswer ?? null,
      confusedWith: answer.confusedWith ?? null,
      answeredAt: answer.answeredAt ? toIsoString(answer.answeredAt) : null,
    };

    if (answer.writingAttempt) {
      const writing = answer.writingAttempt;

      request.writing = {
        strokeCountCorrect: writing.strokeCountCorrect,
        orderCorrect: writing.orderCorrect,
        strokeResults: writing.strokeResults,
      };
    }

    return request;
  }

  async pullRemote(): Promise<PullResult> {
    const db = this.database;
    const result = emptyPullResult();

    let summaries: RemoteQuizSessionSummaryDto[];
    try {
      summaries = await fetchAllPages((limit, offset) => this.fetchSessionsPage(limit, offset));
    } catch (error) {
      result.failed++;
      result.errors.push({ id: 'quiz-sessions', error });
      return result;
    }

    const unique = new Map(summaries.map((s) => [s.quizSessionId, s]));
    result.fetched = unique.size;

    const localIds = new Set((await db.quizSessions.toCollection().primaryKeys()) as string[]);
    const missing = [...unique.values()].filter((s) => !localIds.has(s.quizSessionId));

    const settled = await mapWithConcurrency(missing, DETAIL_CONCURRENCY, (summary) =>
      this.pullSession(summary.quizSessionId),
    );

    settled.forEach((outcome, index) => {
      if (outcome.status === 'fulfilled') {
        if (outcome.value) result.inserted++;
      } else {
        result.failed++;
        result.errors.push({ id: missing[index].quizSessionId, error: outcome.reason });
      }
    });

    return result;
  }

  private async fetchSessionsPage(
    limit: number,
    offset: number,
  ): Promise<RemoteQuizSessionSummaryDto[]> {
    const response = await firstValueFrom(
      this.http.get<RemoteQuizSessionsGroupDto>(`${environment.apiUrl}/quizes/sessions`, {
        params: new HttpParams().set('limit', limit).set('offset', offset),
      }),
    );
    return response.sessions ?? [];
  }

  private async pullSession(quizSessionId: string): Promise<boolean> {
    const db = this.database;

    const detail = await firstValueFrom(
      this.http.get<RemoteQuizSessionDetailDto>(`${environment.apiUrl}/quizes/sessions/detail`, {
        params: new HttpParams().set('quizSessionId', quizSessionId),
      }),
    );

    const session: StoredQuizSession = {
      quizSessionId: detail.quizSessionId,
      listId: detail.listId,
      listName: detail.listName,
      answerType: detail.answerType as AnswerType,
      characterQuizType: (detail.characterQuizType || undefined) as CharacterQuizType | undefined,
      startedAt: new Date(detail.startedAt),
      finishedAt: new Date(detail.finishedAt),
      totalQuestions: detail.totalQuestions,
      randomOrder: detail.randomOrder,
      syncStatus: 'synced',
    };

    const answers = detail.answers.map((answer) =>
      this.toStoredAnswer(detail.quizSessionId, answer),
    );

    return db.transaction('rw', db.quizSessions, db.quizAnswers, async () => {
      if (await db.quizSessions.get(quizSessionId)) return false;

      await db.quizAnswers.bulkPut(answers);
      await db.quizSessions.put(session);
      return true;
    });
  }

  private toStoredAnswer(quizSessionId: string, answer: RemoteQuizAnswerDto): StoredQuizAnswer {
    return {
      quizSessionId,
      unicode: answer.unicode,
      responseTimeMs: answer.responseTimeMs,
      isCorrect: answer.isCorrect,
      givenAnswer: answer.givenAnswer ?? undefined,
      expectedAnswer: answer.expectedAnswer ?? undefined,
      confusedWith: answer.confusedWith ?? undefined,
      answeredAt: answer.answeredAt ? new Date(answer.answeredAt) : undefined,
      writingAttempt: answer.writing
        ? {
            strokeCountCorrect: answer.writing.strokeCountCorrect,
            orderCorrect: answer.writing.orderCorrect,
            strokeResults: answer.writing.strokeResults as StrokeValidationResult[],
          }
        : undefined,
    };
  }
}
