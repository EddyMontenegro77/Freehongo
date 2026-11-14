import { inject, Service } from '@angular/core';
import {
  CategoryProgress,
  CharacterDetail,
  DashboardCategory,
  DashboardSkill,
  GeneralSummary,
  PracticedCharacter,
  SkillProgress,
} from '../models/dashboard.models';
import { DashboardStatsService } from './dashboard-stats.service';
import {
  FetchQuizSessionFilters,
  QuizSessionWithList,
  StoredCharacterStat,
} from '../../../shared/models/quizes/quizes-storage.interface';

@Service()
export class DashboardFacadeService {
  private readonly dashboardStatsService = inject(DashboardStatsService);

  getGeneralSummaryData(): Promise<GeneralSummary> {
    return this.dashboardStatsService.buildSummaryStats();
  }

  getCategoriesProgressData(): Promise<Record<DashboardCategory, CategoryProgress>> {
    return this.dashboardStatsService.buildCategoriesStats();
  }

  getSkillsProgressData(): Promise<Record<DashboardSkill, SkillProgress>> {
    return this.dashboardStatsService.buildSkillsStats();
  }

  fetchQuizSessions(filters: FetchQuizSessionFilters): Promise<QuizSessionWithList[]> {
    return this.dashboardStatsService.fetchQuizSession(filters);
  }

  getCharacterStats(): Promise<[PracticedCharacter[], StoredCharacterStat[]]> {
    return Promise.all([
      this.dashboardStatsService.fetchPracticedCharacters(),
      this.dashboardStatsService.fetchWeakCharacters(),
    ]);
  }

  getCharacterDetail(unicode: string): Promise<CharacterDetail> {
    return this.dashboardStatsService.fetchCharacterDetail(unicode);
  }
}
