import { Injectable } from '@angular/core';
import { db } from '../../../core/db/db';
import { StoredQuizAnswer, StoredQuizSession } from '../../../shared/models/quizes/quizes-storage.interface';
import {
  CATEGORY_LABELS,
  DashboardAnswerContext,
  DashboardCategory,
  DashboardData,
  DashboardSkill,
  MasteryLevel,
  ProgressSummary,
  SKILL_LABELS,
  TrendPeriod,
} from '../models/dashboard.models';

interface Accumulator {
  attempts: number;
  correct: number;
  responseMs: number;
  lastSeenAt: Date;
  firstSeenAt: Date;
}

const emptyAccumulator = (): Accumulator => ({
  attempts: 0,
  correct: 0,
  responseMs: 0,
  lastSeenAt: new Date(0),
  firstSeenAt: new Date(),
});

@Injectable({ providedIn: 'root' })
export class DashboardDataService {
  async getDashboard(period: TrendPeriod = 30): Promise<DashboardData> {
    const [sessions, answers] = await Promise.all([
      db.quizSessions.toArray(),
      db.quizAnswers.toArray(),
    ]);
    return this.aggregate(sessions, answers, period);
  }

  private aggregate(
    sessions: StoredQuizSession[],
    answers: StoredQuizAnswer[],
    period: TrendPeriod,
  ): DashboardData {
    const sessionById = new Map(sessions.map((session) => [session.quizSessionId, session]));
    const contexts: DashboardAnswerContext[] = answers.flatMap((answer) => {
      const session = sessionById.get(answer.quizSessionId);
      if (!session || !answer.answeredAt) return [];
      return [{
        unicode: answer.unicode,
        answerType: session.answerType,
        characterQuizType: session.characterQuizType,
        isCorrect: answer.isCorrect,
        responseTimeMs: answer.responseTimeMs,
        answeredAt: new Date(answer.answeredAt),
      }];
    });

    const characterMap = new Map<string, Map<DashboardSkill, Accumulator>>();
    for (const context of contexts) {
      const skill = this.skillFor(context);
      const skillMap = characterMap.get(context.unicode) ?? new Map<DashboardSkill, Accumulator>();
      const accumulator = skillMap.get(skill) ?? emptyAccumulator();
      this.add(accumulator, context);
      skillMap.set(skill, accumulator);
      characterMap.set(context.unicode, skillMap);
    }

    const characters = [...characterMap.entries()].map(([unicode, skillMap]) => {
      const skills = {
        reading: this.summary(skillMap.get('reading')),
        meaning: this.summary(skillMap.get('meaning')),
        writing: this.summary(skillMap.get('writing')),
      };
      const all = [...skillMap.values()].reduce((total, value) => this.merge(total, value), emptyAccumulator());
      const summary = this.summary(all);
      return {
        unicode,
        literal: this.literal(unicode),
        category: this.category(unicode),
        ...summary,
        averageResponseMs: all.attempts ? Math.round(all.responseMs / all.attempts) : 0,
        lastSeenAt: all.lastSeenAt,
        skills,
      };
    }).sort((a, b) => b.score - a.score);

    const categories = (['hiragana', 'katakana', 'kanji'] as DashboardCategory[]).map((category) => ({
      category,
      ...this.groupSummary(characters.filter((character) => character.category === category)),
    }));
    const skills = (['reading', 'meaning', 'writing'] as DashboardSkill[]).map((skill) => ({
      skill,
      ...this.groupSkillSummary(characters, skill),
    }));

    return {
      overview: this.groupSummary(characters),
      categories,
      skills,
      characters,
      trends: this.trends(contexts, period),
      totalSessions: sessions.length,
    };
  }

  private add(target: Accumulator, context: DashboardAnswerContext): void {
    target.attempts += 1;
    target.correct += context.isCorrect ? 1 : 0;
    target.responseMs += context.responseTimeMs;
    target.lastSeenAt = context.answeredAt > target.lastSeenAt ? context.answeredAt : target.lastSeenAt;
    target.firstSeenAt = context.answeredAt < target.firstSeenAt ? context.answeredAt : target.firstSeenAt;
  }

  private merge(target: Accumulator, source: Accumulator): Accumulator {
    target.attempts += source.attempts;
    target.correct += source.correct;
    target.responseMs += source.responseMs;
    target.lastSeenAt = source.lastSeenAt > target.lastSeenAt ? source.lastSeenAt : target.lastSeenAt;
    target.firstSeenAt = source.firstSeenAt < target.firstSeenAt ? source.firstSeenAt : target.firstSeenAt;
    return target;
  }

  private summary(value?: Accumulator): ProgressSummary {
    const attempts = value?.attempts ?? 0;
    const accuracy = attempts ? (value!.correct / attempts) * 100 : 0;
    const score = accuracy * Math.min(attempts / 10, 1);
    return {
      score: Math.round(score),
      accuracy: Math.round(accuracy),
      attempts,
      practicedCharacters: attempts ? 1 : 0,
      masteredCharacters: score > 80 ? 1 : 0,
      level: this.level(score),
    };
  }

  private groupSummary(characters: Array<{ score: number; accuracy: number; attempts: number; level: MasteryLevel }>): ProgressSummary {
    const attempts = characters.reduce((sum, character) => sum + character.attempts, 0);
    const accuracy = attempts ? characters.reduce((sum, character) => sum + character.accuracy * character.attempts, 0) / attempts : 0;
    const score = characters.length ? characters.reduce((sum, character) => sum + character.score, 0) / characters.length : 0;
    return {
      score: Math.round(score),
      accuracy: Math.round(accuracy),
      attempts,
      practicedCharacters: characters.filter((character) => character.attempts > 0).length,
      masteredCharacters: characters.filter((character) => character.level === 'mastered').length,
      level: this.level(score),
    };
  }

  private groupSkillSummary(characters: any[], skill: DashboardSkill): ProgressSummary {
    return this.groupSummary(characters.map((character) => character.skills[skill]));
  }

  private trends(contexts: DashboardAnswerContext[], period: TrendPeriod) {
    const cutoff = period === 'all' ? 0 : Date.now() - period * 24 * 60 * 60 * 1000;
    const grouped = new Map<string, DashboardAnswerContext[]>();
    contexts.filter((context) => context.answeredAt.getTime() >= cutoff).forEach((context) => {
      const date = context.answeredAt.toISOString().slice(0, 10);
      grouped.set(date, [...(grouped.get(date) ?? []), context]);
    });
    return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, values]) => ({
      date,
      attempts: values.length,
      accuracy: Math.round(values.filter((value) => value.isCorrect).length / values.length * 100),
      studyTimeMs: values.reduce((sum, value) => sum + value.responseTimeMs, 0),
    }));
  }

  private skillFor(context: DashboardAnswerContext): DashboardSkill {
    if (context.answerType === 'strokeWriting') return 'writing';
    return context.characterQuizType?.includes('Meaning') || context.characterQuizType?.includes('meaning')
      ? 'meaning'
      : 'reading';
  }

  private category(unicode: string): DashboardCategory {
    const codePoint = Number.parseInt(unicode, 16);
    if (codePoint >= 0x3040 && codePoint <= 0x309f) return 'hiragana';
    if (codePoint >= 0x30a0 && codePoint <= 0x30ff) return 'katakana';
    return 'kanji';
  }

  private literal(unicode: string): string {
    const codePoint = Number.parseInt(unicode, 16);
    return Number.isNaN(codePoint) ? unicode : String.fromCodePoint(codePoint);
  }

  private level(score: number): MasteryLevel {
    if (score <= 20) return 'new';
    if (score <= 50) return 'beginner';
    if (score <= 80) return 'intermediate';
    return 'mastered';
  }
}
