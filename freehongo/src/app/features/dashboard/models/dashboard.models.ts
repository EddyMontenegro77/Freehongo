import { Milestone } from '../../../shared/components/progressbar/progressbar';
import { AnswerType, CharacterQuizType } from '../../../shared/models/quizes/quizes.interface';

export type DashboardCategory = 'hiragana' | 'katakana' | 'kanji';
export type DashboardSkill = 'reading' | 'meaning' | 'writing';
export type MasteryLevel = 'new' | 'beginner' | 'intermediate' | 'mastered';
export type TrendPeriod = 7 | 30 | 90 | 'all';

export const CATEGORY_TOTALS: Record<DashboardCategory, number> = {
  hiragana: 86,
  katakana: 94,
  kanji: 6400,
};

export const CONFIDENT_ATTEMPTS = 10;
export const MAX_ANSWER_MS = 120_000;

export interface GeneralSummary {
  masteryLevel: MasteryLevel;
  accuracy: number;
  totalSessions: number;
  dayStreak: number;
  averageResponseTimeMs: number;
}

export interface ProgressSummary {
  score: number;
  accuracy: number;
  attempts: number;
  practicedCharacters: number;
  masteredCharacters: number;
  level: MasteryLevel;
}

export interface CategoryProgress {
  category: DashboardCategory;
  totalCharacters: number;
  levelDistribution: Record<MasteryLevel, number>;
}

export interface SkillProgress {
  skill: DashboardSkill;
  averageResponseMs: number;
  levelDistribution: Record<MasteryLevel, number>;
}

export interface CharacterProgress {
  unicode: string;
  literal: string;
  category: DashboardCategory;
  score: number;
  level: MasteryLevel;
  accuracy: number;
  attempts: number;
  averageResponseMs: number;
  lastSeenAt: Date;
  skills: Record<DashboardSkill, ProgressSummary>;
}

export interface SkillAnswer {
  skill: DashboardSkill;
  unicode: string;
  isCorrect: boolean;
  responseTimeMs: number;
}

export interface TrendPoint {
  date: string;
  attempts: number;
  accuracy: number;
  studyTimeMs: number;
}

export interface DashboardData {
  overview: ProgressSummary;
  categories: CategoryProgress[];
  skills: SkillProgress[];
  characters: CharacterProgress[];
  trends: TrendPoint[];
  totalSessions: number;
}

export const DASHBOARD_MILESTONES: Milestone[] = [
  { value: 0, label: 'New' },
  { value: 20, label: 'New' },
  { value: 50, label: 'Beginner' },
  { value: 80, label: 'Intermediate' },
  { value: 100, label: 'Mastered' },
];

export const CATEGORY_LABELS: Record<DashboardCategory, string> = {
  hiragana: 'Hiragana',
  katakana: 'Katakana',
  kanji: 'Kanji',
};

export const SKILL_LABELS: Record<DashboardSkill, string> = {
  reading: 'Reading',
  meaning: 'Meaning',
  writing: 'Writing',
};

export interface DashboardAnswerContext {
  unicode: string;
  answerType: AnswerType;
  characterQuizType?: CharacterQuizType;
  isCorrect: boolean;
  responseTimeMs: number;
  answeredAt: Date;
}
