import { FreeHongoDB } from '../../../core/db/db';
import { dayKey, groupBy, sumBy } from '../../../core/db/utils/query.utils';
import { StoredCharacterStat } from '../../../shared/models/quizes/quizes-storage.interface';
import { GeneralSummary, MasteryLevel } from '../models/dashboard.models';

const CONFIDENT_ATTEMPTS = 5;

export class SummaryRepository {
  constructor(private readonly db: FreeHongoDB) {}

  async getSummary(): Promise<GeneralSummary> {
    const [stats, sessionStarts] = await Promise.all([
      this.db.characterStats.toArray(),
      this.db.quizSessions.orderBy('startedAt').keys(),
    ]);

    return {
      masteryLevel: this.masteryLevel(stats),
      accuracy: this.accuracy(stats),
      totalSessions: stats.length,
      dayStreak: this.dayStreak(sessionStarts as Date[]),
      averageResponseTimeMs: this.averageResponseTimeMs(stats),
    };
  }

  private masteryLevel(stats: StoredCharacterStat[]): MasteryLevel {
    const rowsByCharacter = groupBy(stats, (s) => s.unicode);
    if (!rowsByCharacter.size) return 'new';

    const scores = [...rowsByCharacter.values()].map((rows) => {
      const attempts = sumBy(rows, (r) => r.attempts);
      const accuracy = sumBy(rows, (r) => r.correctCount) / attempts;
      const confidence = Math.min(1, attempts / CONFIDENT_ATTEMPTS);
      return accuracy * confidence * 100;
    });

    const score = sumBy(scores, (value) => value) / scores.length;

    if (score < 20) return 'new';
    if (score < 50) return 'beginner';
    if (score < 80) return 'intermediate';
    return 'mastered';
  }

  private accuracy(stats: StoredCharacterStat[]): number {
    const attempts = sumBy(stats, (s) => s.attempts);
    return attempts ? (sumBy(stats, (s) => s.correctCount) / attempts) * 100 : 0;
  }

  private averageResponseTimeMs(stats: StoredCharacterStat[]): number {
    const attempts = sumBy(stats, (s) => s.attempts);
    return attempts ? sumBy(stats, (s) => s.totalResponseMs) / attempts : 0;
  }

  private dayStreak(sessionStarts: Date[]): number {
    const days = new Set(sessionStarts.map(dayKey));
    const cursor = new Date();

    if (!days.has(dayKey(cursor))) {
      cursor.setDate(cursor.getDate() - 1);
    }

    let streak = 0;
    while (days.has(dayKey(cursor))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }
}
