import { inject, Service } from '@angular/core';
import { GeneralSummary } from '../models/dashboard.models';
import { DashboardStatsService } from './dashboard-stats.service';

@Service()
export class DashboardFacadeService {
  private readonly dashboardStatsService = inject(DashboardStatsService);

  getGeneralSummaryData(): Promise<GeneralSummary> {
    return this.dashboardStatsService.buildSummaryStats();
  }
}
