import { inject, Service } from '@angular/core';
import {
  CategoryProgress,
  DashboardCategory,
  DashboardSkill,
  GeneralSummary,
  SkillProgress,
} from '../models/dashboard.models';
import { DashboardStatsService } from './dashboard-stats.service';

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
}
