import { inject, Service } from '@angular/core';
import { DatabaseService } from '../../../core/db/services/database.service';
import {
  StoredCharacterStat,
  WritingAttemptResult,
  StoredQuizSession,
  StoredQuizAnswer,
} from '../../../shared/models/quizes/quizes-storage.interface';
import { AnswerType } from '../../../shared/models/quizes/quizes.interface';
import { toTime } from '../../../core/sync/sync.utils';
import { GeneralSummary, ProgressSummary } from '../models/dashboard.models';
import { SummaryRepository } from '../repositories/summary.repository';

interface Attempt {
  at: number;
  responseTimeMs: number;
  isCorrect: boolean;
}

interface StatGroup {
  unicode: string;
  answerType: AnswerType;
  attempts: Attempt[];
}

@Service()
export class DashboardStatsService {
  private readonly databaseService = inject(DatabaseService);

  private get db() {
    return this.databaseService.database;
  }

  async buildSummaryStats(): Promise<GeneralSummary> {
    const summaryRepository = new SummaryRepository(this.db);
    return summaryRepository.getSummary();
  }

  async rebuildCharacterStats(): Promise<number> {
    const db = this.db;

    return db.transaction('rw', db.quizSessions, db.quizAnswers, db.characterStats, async () => {
      const sessions = await db.quizSessions.toArray();
      const answers = await db.quizAnswers.toArray();
      const sessionById = new Map(sessions.map((s) => [s.quizSessionId, s]));

      const groups = new Map<string, StatGroup>();

      for (const answer of answers) {
        const session = sessionById.get(answer.quizSessionId);
        if (!session) continue; // respuesta huérfana

        const key = `${answer.unicode}|${session.answerType}`;
        let group = groups.get(key);
        if (!group) {
          group = { unicode: answer.unicode, answerType: session.answerType, attempts: [] };
          groups.set(key, group);
        }

        group.attempts.push({
          at: toTime(answer.answeredAt ?? session.finishedAt),
          responseTimeMs: answer.responseTimeMs,
          isCorrect: answer.isCorrect,
        });
      }

      const stats = [...groups.values()].map((group) => this.buildStat(group));

      await db.characterStats.clear();
      await db.characterStats.bulkPut(stats);

      return stats.length;
    });
  }

  private buildStat(group: StatGroup): StoredCharacterStat {
    const attempts = [...group.attempts].sort((a, b) => a.at - b.at);

    let correctStreak = 0;
    for (let i = attempts.length - 1; i >= 0 && attempts[i].isCorrect; i--) {
      correctStreak++;
    }

    return {
      unicode: group.unicode,
      answerType: group.answerType,
      attempts: attempts.length,
      totalResponseMs: attempts.reduce((sum, a) => sum + a.responseTimeMs, 0),
      correctStreak,
      correctCount: attempts.filter((a) => a.isCorrect).length,
      firstSeenAt: new Date(attempts[0].at),
      lastSeenAt: new Date(attempts[attempts.length - 1].at),
    };
  }
}
