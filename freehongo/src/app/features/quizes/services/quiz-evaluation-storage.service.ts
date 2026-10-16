import { Injectable } from '@angular/core';
import { QuizEvaluationResult } from '../../../shared/models/quizes/quizes.interface';
import {
  StoredCharacterStat,
  StoredQuizAnswer,
  StoredQuizSession,
} from '../../../shared/models/quizes/quizes-storage.interface';
import { db } from '../../../core/db/db';

const MIN_QUESTIONS = 2;

// ─────────────────────────────────────────────────────────────
// Mappers (runtime model -> storage model)
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
// Validation (mirrors the CHECK constraints of the cloud database)
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class QuizEvaluationStorageService {
  /**
   * Stores the session, its answers and the updated character stats in a single
   * transaction, so a session can never be saved without its answers.
   */
  async saveEvaluation(result: QuizEvaluationResult): Promise<void> {
    assertValid(result);

    const session = toStoredQuizSession(result);
    const answers = toStoredAnswers(result);

    await db.transaction('rw', db.quizSessions, db.quizAnswers, db.characterStats, async () => {
      await db.quizSessions.add(session);
      await db.quizAnswers.bulkAdd(answers);
      await this.updateStats(result);
    });
  }

  /** One answer per character per session (guaranteed by assertValid), so one step each. */
  private async updateStats(result: QuizEvaluationResult): Promise<void> {
    const keys = result.answers.map(
      (a) => [a.characterUnicode, result.answerType] as [string, string],
    );
    const existing = await db.characterStats.bulkGet(keys);

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

    await db.characterStats.bulkPut(updated);
  }
}
