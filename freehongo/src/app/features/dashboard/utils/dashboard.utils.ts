import { isHiragana, isKanji, isKatakana } from 'wanakana';
import {
  StoredCharacterStat,
  StoredQuizAnswer,
  StoredQuizSession,
} from '../../../shared/models/quizes/quizes-storage.interface';
import {
  CONFIDENT_ATTEMPTS,
  ConfusionCount,
  DailyBucket,
  DashboardCategory,
  DashboardSkill,
  MasteryLevel,
  PeriodTotals,
  TrendComparison,
  TrendGranularity,
  TrendPeriod,
  TrendPoint,
  WritingSummary,
} from '../models/dashboard.models';

export function skillOf(session: StoredQuizSession): DashboardSkill | null {
  if (session.answerType === 'strokeWriting') return 'writing';

  switch (session.characterQuizType) {
    case 'characterToReading':
    case 'readingToCharacter':
      return 'reading';
    case 'characterToMeaning':
    case 'meaningToCharacter':
      return 'meaning';
    default:
      return null;
  }
}

export function categoryOf(unicode: string): DashboardCategory | null {
  const char = String.fromCodePoint(parseInt(unicode, 16));

  if (isKatakana(char)) return 'katakana';
  if (isHiragana(char)) return 'hiragana';
  if (isKanji(char)) return 'kanji';

  return null;
}

export function kanaOrKanji(unicode: string): string | null {
  const char = String.fromCodePoint(parseInt(unicode, 16));

  if (isHiragana(char) || isKatakana(char)) return 'kana';
  if (isKanji(char)) return 'kanji';

  return null;
}

export function countByLevel(levels: MasteryLevel[]): Record<MasteryLevel, number> {
  const counts: Record<MasteryLevel, number> = {
    new: 0,
    beginner: 0,
    intermediate: 0,
    mastered: 0,
  };

  for (const level of levels) {
    counts[level]++;
  }

  return counts;
}

export function levelOf(score: number): MasteryLevel {
  if (score < 20) return 'new';
  if (score < 50) return 'beginner';
  if (score < 80) return 'intermediate';
  return 'mastered';
}

export function characterScore(attempts: number, correct: number): number {
  if (attempts <= 0) return 0;
  return (correct / attempts) * Math.min(1, attempts / CONFIDENT_ATTEMPTS) * 100;
}

export function weaknessScore(s: StoredCharacterStat): number {
  return (s.correctCount + 1) / (s.attempts + 2);
}

export const countPairs = (ids: (string | undefined)[]): ConfusionCount[] => {
  const counts = new Map<string, number>();
  for (const id of ids) if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
  return [...counts]
    .map(([unicode, count]) => ({ unicode, count }))
    .sort((a, b) => b.count - a.count);
};

export const summarizeWriting = (answers: StoredQuizAnswer[]): WritingSummary | undefined => {
  const w = answers.filter((a) => a.writingAttempt);
  if (!w.length) return undefined;

  const valid: number[] = [];
  const total: number[] = [];
  for (const a of w) {
    a.writingAttempt!.strokeResults.forEach((r, i) => {
      valid[i] = (valid[i] ?? 0) + (r.isValid ? 1 : 0);
      total[i] = (total[i] ?? 0) + 1;
    });
  }

  return {
    attempts: w.length,
    strokeCountCorrectRate: w.filter((a) => a.writingAttempt!.strokeCountCorrect).length / w.length,
    orderCorrectRate: w.filter((a) => a.writingAttempt!.orderCorrect).length / w.length,
    validRateByStroke: valid.map((v, i) => v / total[i]),
  };
};

export function toLocalDateKey(d: Date): string {
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

const dateKeyDaysAgo = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return toLocalDateKey(d);
};

const weekStartKey = (dateKey: string): string => {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7)); // lunes
  return toLocalDateKey(date);
};

export function filterBuckets(
  buckets: DailyBucket[],
  period: TrendPeriod,
  skill: DashboardSkill | 'all' = 'all',
  previous = false,
): DailyBucket[] {
  let from = '';
  let to = '9999-12-31';

  if (period !== 'all') {
    from = dateKeyDaysAgo(previous ? 2 * period - 1 : period - 1);
    to = dateKeyDaysAgo(previous ? period : 0);
  }

  return buckets.filter(
    (b) => b.date >= from && b.date <= to && (skill === 'all' || b.skill === skill),
  );
}

export function toSeries(
  buckets: DailyBucket[],
  granularity: TrendGranularity,
  period?: TrendPeriod,
): TrendPoint[] {
  const grouped = new Map<string, { attempts: number; correct: number; studyTimeMs: number }>();

  for (const b of buckets) {
    const key = granularity === 'week' ? weekStartKey(b.date) : b.date;
    const cur = grouped.get(key) ?? { attempts: 0, correct: 0, studyTimeMs: 0 };
    cur.attempts += b.attempts;
    cur.correct += b.correct;
    cur.studyTimeMs += b.studyTimeMs;
    grouped.set(key, cur);
  }

  const keys =
    granularity === 'day' && typeof period === 'number'
      ? Array.from({ length: period }, (_, i) => dateKeyDaysAgo(period - 1 - i))
      : [...grouped.keys()].sort();

  return keys.map((date) => {
    const g = grouped.get(date);
    return {
      date,
      attempts: g?.attempts ?? 0,
      accuracy: g?.attempts ? (g.correct / g.attempts) * 100 : null,
      studyTimeMs: g?.studyTimeMs ?? 0,
    };
  });
}

export const totalsOf = (buckets: DailyBucket[]): PeriodTotals => {
  const attempts = buckets.reduce((s, b) => s + b.attempts, 0);
  const correct = buckets.reduce((s, b) => s + b.correct, 0);
  return {
    attempts,
    accuracy: attempts ? (correct / attempts) * 100 : null,
    studyTimeMs: buckets.reduce((s, b) => s + b.studyTimeMs, 0),
  };
};

export function comparePeriods(
  buckets: DailyBucket[],
  period: TrendPeriod,
  skill: DashboardSkill | 'all' = 'all',
): TrendComparison | null {
  if (period === 'all') return null;

  const current = totalsOf(filterBuckets(buckets, period, skill));
  const previous = totalsOf(filterBuckets(buckets, period, skill, true));

  return {
    current,
    previous,
    accuracyDelta:
      current.accuracy !== null && previous.accuracy !== null
        ? current.accuracy - previous.accuracy
        : null,
    attemptsDelta: previous.attempts
      ? ((current.attempts - previous.attempts) / previous.attempts) * 100
      : null,
  };
}
