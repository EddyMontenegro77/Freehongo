import { FreeHongoDB } from '../../../core/db/db';
import { groupBy } from '../../../core/db/utils/query.utils';
import {
  CATEGORY_TOTALS,
  CategoryProgress,
  DashboardCategory,
  MasteryLevel,
} from '../models/dashboard.models';
import { categoryOf, characterScore, countByLevel, levelOf } from '../utils/dashboard.utils';

export class CategoriesRepository {
  constructor(private readonly db: FreeHongoDB) {}

  async getCategoriesProgressReport(): Promise<Record<DashboardCategory, CategoryProgress>> {
    const stats = await this.db.characterStats.toArray();

    const levels: Record<DashboardCategory, MasteryLevel[]> = {
      hiragana: [],
      katakana: [],
      kanji: [],
    };

    for (const [unicode, rows] of groupBy(stats, (s) => s.unicode)) {
      const category = categoryOf(unicode);
      if (!category) continue;

      const bestScore = Math.max(...rows.map((r) => characterScore(r.attempts, r.correctCount)));

      levels[category].push(levelOf(bestScore));
    }

    return {
      hiragana: this.build('hiragana', levels.hiragana),
      katakana: this.build('katakana', levels.katakana),
      kanji: this.build('kanji', levels.kanji),
    };
  }

  private build(category: DashboardCategory, levels: MasteryLevel[]): CategoryProgress {
    return {
      category,
      totalCharacters: CATEGORY_TOTALS[category],
      levelDistribution: countByLevel(levels),
    };
  }
}
