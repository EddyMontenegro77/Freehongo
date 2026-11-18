import { FreeHongoDB } from '../../../core/db/db';
import { groupBy, join, sumBy } from '../../../core/db/utils/query.utils';
import {
  DashboardSkill,
  MAX_ANSWER_MS,
  SkillAnswer,
  SkillProgress,
} from '../models/dashboard.models';
import { characterScore, countByLevel, levelOf, skillOf } from '../utils/dashboard.utils';

export class SkillsRepository {
  constructor(private readonly db: FreeHongoDB) {}

  async getSkillsProgressReport(): Promise<Record<DashboardSkill, SkillProgress>> {
    const [sessions, answers] = await Promise.all([
      this.db.quizSessions.toArray(),
      this.db.quizAnswers.toArray(),
    ]);

    const skillAnswers = join(
      answers,
      sessions,
      (answer) => answer.quizSessionId,
      (session) => session.quizSessionId,
    ).flatMap(([answer, session]): SkillAnswer[] => {
      const skill = skillOf(session);
      if (!skill) return [];

      return [
        {
          skill,
          unicode: answer.unicode,
          isCorrect: answer.isCorrect,
          responseTimeMs: answer.responseTimeMs,
        },
      ];
    });

    const bySkill = groupBy(skillAnswers, (a) => a.skill);

    return {
      reading: this.build('reading', bySkill.get('reading') ?? []),
      meaning: this.build('meaning', bySkill.get('meaning') ?? []),
      writing: this.build('writing', bySkill.get('writing') ?? []),
    };
  }

  private build(skill: DashboardSkill, answers: SkillAnswer[]): SkillProgress {
    const levels = [...groupBy(answers, (a) => a.unicode).values()].map((rows) => {
      const correct = rows.filter((row) => row.isCorrect).length;
      return levelOf(characterScore(rows.length, correct));
    });

    return {
      skill,
      averageResponseMs: answers.length
        ? sumBy(answers, (a) => Math.min(a.responseTimeMs, MAX_ANSWER_MS)) / answers.length
        : 0,
      levelDistribution: countByLevel(levels),
    };
  }
}
