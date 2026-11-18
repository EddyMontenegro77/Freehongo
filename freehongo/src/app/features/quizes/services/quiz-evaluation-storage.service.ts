import { inject, Injectable } from '@angular/core';
import { QuizEvaluationResult } from '../../../shared/models/quizes/quizes.interface';
import {
  QuizSessionDetail,
  StoredCharacterStat,
  StoredQuizAnswer,
  StoredQuizSession,
} from '../../../shared/models/quizes/quizes-storage.interface';
import { FreeHongoDB } from '../../../core/db/db';
import { DatabaseService } from '../../../core/db/services/database.service';
import { SyncTriggerService } from '../../../core/sync/services/sync-trigger.service';
import { Dexie } from 'dexie';
import { toTime } from '../../../core/sync/sync.utils';

const MIN_QUESTIONS = 2;

function toStoredQuizSession(r: QuizEvaluationResult): StoredQuizSession {
  return {
    quizSessionId: r.id,
    listId: r.listId,
    answerType: r.answerType,
    characterQuizType: r.answerType === 'strokeWriting' ? undefined : r.characterQuizType,
    startedAt: new Date(r.startedAt),
    finishedAt: new Date(r.completedAt),
    totalQuestions: r.total,
    randomOrder: r.order === 'random',
    syncStatus: 'pending',
  };
}

function toStoredAnswers(r: QuizEvaluationResult): StoredQuizAnswer[] {
  if (r.answerType === 'strokeWriting') {
    return r.answers.map((a) => ({
      quizSessionId: r.id,
      unicode: a.characterUnicode,
      responseTimeMs: a.responseTimeMs,
      isCorrect: a.correct,
      expectedAnswer: a.expectedAnswer,
      answeredAt: new Date(a.answeredAt),
      writingAttempt: a.writing,
    }));
  }

  return r.answers.map((a) => ({
    quizSessionId: r.id,
    unicode: a.characterUnicode,
    responseTimeMs: a.responseTimeMs,
    isCorrect: a.correct,
    givenAnswer: a.answer,
    expectedAnswer: a.expectedAnswer,
    confusedWith: a.confusedWith,
    answeredAt: new Date(a.answeredAt),
  }));
}

function assertValid(r: QuizEvaluationResult): void {
  if (r.total < MIN_QUESTIONS || r.answers.length < MIN_QUESTIONS) {
    throw new Error(`An evaluation needs at least ${MIN_QUESTIONS} questions.`);
  }

  const unicodes = r.answers.map((a) => a.characterUnicode);
  if (new Set(unicodes).size !== unicodes.length) {
    throw new Error('The same character cannot be answered twice in one session.');
  }

  if (r.answers.some((a) => a.responseTimeMs < 0)) {
    throw new Error('Response times cannot be negative.');
  }

  if (new Date(r.completedAt) < new Date(r.startedAt)) {
    throw new Error('A session cannot finish before it starts.');
  }
}

@Injectable({ providedIn: 'root' })
export class QuizEvaluationStorageService {
  private readonly databaseService = inject(DatabaseService);
  private readonly syncTrigger = inject(SyncTriggerService);

  protected get database(): FreeHongoDB {
    return this.databaseService.database;
  }

  async saveEvaluation(result: QuizEvaluationResult): Promise<void> {
    assertValid(result);

    const session = toStoredQuizSession(result);
    const answers = toStoredAnswers(result);

    await this.database.transaction(
      'rw',
      this.database.quizSessions,
      this.database.quizAnswers,
      this.database.characterStats,
      async () => {
        await this.database.quizSessions.add(session);
        await this.database.quizAnswers.bulkAdd(answers);
        await this.updateStats(result);
      },
    );

    this.syncTrigger.schedule();
  }

  private async updateStats(result: QuizEvaluationResult): Promise<void> {
    const keys = result.answers.map(
      (a) => [a.characterUnicode, result.answerType] as [string, string],
    );
    const existing = await this.database.characterStats.bulkGet(keys);

    const updated: StoredCharacterStat[] = result.answers.map((a, i) => {
      const prev = existing[i];
      const seenAt = new Date(a.answeredAt);

      return {
        unicode: a.characterUnicode,
        answerType: result.answerType,
        attempts: (prev?.attempts ?? 0) + 1,
        totalResponseMs: (prev?.totalResponseMs ?? 0) + a.responseTimeMs,
        correctCount: (prev?.correctCount ?? 0) + (a.correct ? 1 : 0),
        correctStreak: a.correct ? (prev?.correctStreak ?? 0) + 1 : 0,
        firstSeenAt: prev?.firstSeenAt ?? seenAt,
        lastSeenAt: seenAt,
      };
    });

    await this.database.characterStats.bulkPut(updated);
  }

  async getSessionDetail(sessionId: string): Promise<QuizSessionDetail | null> {
    const session = await this.database.quizSessions.get(sessionId);
    if (!session) return null;

    const [list, answers] = await Promise.all([
      this.database.lists.get(session.listId),
      this.getSessionAnswers(sessionId),
    ]);

    return {
      session: { ...session, listName: list?.name ?? null },
      answers,
    };
  }

  async getSessionAnswers(sessionId: string): Promise<StoredQuizAnswer[]> {
    const answers = await this.database.quizAnswers
      .where('[quizSessionId+unicode]')
      .between([sessionId, Dexie.minKey], [sessionId, Dexie.maxKey])
      .toArray();

    return answers.sort(
      (a, b) =>
        (a.answeredAt ? toTime(a.answeredAt) : 0) - (b.answeredAt ? toTime(b.answeredAt) : 0),
    );
  }
}
