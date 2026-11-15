import { isHiragana, isKanji, isKatakana } from 'wanakana';
import {
  StoredCharacterStat,
  StoredQuizAnswer,
  StoredQuizSession,
} from '../../../shared/models/quizes/quizes-storage.interface';
import {
  CONFIDENT_ATTEMPTS,
  ConfusionCount,
  DashboardCategory,
  DashboardSkill,
  MasteryLevel,
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
