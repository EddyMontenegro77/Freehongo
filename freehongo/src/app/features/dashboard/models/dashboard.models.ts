import { Milestone } from '../../../shared/components/progressbar/progressbar';
import { AnswerType, CharacterQuizType } from '../../../shared/models/quizes/quizes.interface';

export type DashboardCategory = 'hiragana' | 'katakana' | 'kanji';
export type DashboardSkill = 'reading' | 'meaning' | 'writing';
export type MasteryLevel = 'new' | 'beginner' | 'intermediate' | 'mastered';
export type TrendPeriod = 7 | 30 | 90 | 'all';

export interface ProgressSummary {
  score: number;
  accuracy: number;
  attempts: number;
  practicedCharacters: number;
  masteredCharacters: number;
  level: MasteryLevel;
}

export interface CategoryProgress extends ProgressSummary {
  category: DashboardCategory;
}

export interface SkillProgress extends ProgressSummary {
  skill: DashboardSkill;
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
