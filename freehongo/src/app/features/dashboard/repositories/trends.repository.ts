import { FreeHongoDB } from '../../../core/db/db';
import { DailyBucket, MAX_ANSWER_MS } from '../models/dashboard.models';
import { skillOf, toLocalDateKey } from '../utils/dashboard.utils';

export class TrendsRepository {
  constructor(private readonly db: FreeHongoDB) {}

  async getDailyBuckets(): Promise<DailyBucket[]> {
    const [sessions, answers] = await Promise.all([
      this.db.quizSessions.toArray(),
      this.db.quizAnswers.toArray(),
    ]);
    const sessionById = new Map(sessions.map((s) => [s.quizSessionId, s]));

    const buckets = new Map<string, DailyBucket>();
    for (const a of answers) {
      const session = sessionById.get(a.quizSessionId);
      if (!session) continue;

      const skill = skillOf(session);
      if (!skill) continue;

      const date = toLocalDateKey(new Date(a.answeredAt ?? session.finishedAt));
      const key = `${date}|${skill}`;

      const bucket = buckets.get(key) ?? { date, skill, attempts: 0, correct: 0, studyTimeMs: 0 };
      bucket.attempts++;
      if (a.isCorrect) bucket.correct++;
      bucket.studyTimeMs += Math.min(a.responseTimeMs, MAX_ANSWER_MS);
      buckets.set(key, bucket);
    }

    return [...buckets.values()].sort(
      (a, b) => a.date.localeCompare(b.date) || a.skill.localeCompare(b.skill),
    );
  }
}
