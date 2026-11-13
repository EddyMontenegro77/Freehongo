import { isHiragana, isKanji, isKatakana } from 'wanakana';
import { StoredQuizSession } from '../../../shared/models/quizes/quizes-storage.interface';
import {
  CONFIDENT_ATTEMPTS,
  DashboardCategory,
  DashboardSkill,
  MasteryLevel,
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
