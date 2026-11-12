import { Component, inject, signal } from '@angular/core';
import { Milestone, Progressbar } from '../../../../shared/components/progressbar/progressbar';
import { LoadingState } from '../../../../shared/components/app-state/loading-state/loading-state';
import { Summary } from '../../components/summary/summary';
import { GeneralSummary } from '../../models/dashboard.models';
import { DashboardFacadeService } from '../../services/dashboard.facade.service';

@Component({
  imports: [Progressbar, LoadingState, Summary],
  selector: 'app-dashboard',
  styleUrl: './dashboard.scss',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private readonly dashboardFacadeService = inject(DashboardFacadeService);

  readonly generalSummary = signal<GeneralSummary | null>(null);
  isLoading = signal<boolean>(true);

  milestones: Milestone[] = [
    {
      value: 50,
      label: 'Half',
    },
    {
      value: 80,
      label: 'Eighty',
    },
  ];

  ngOnInit(): void {
    this.loadDashboard();
  }

  async loadDashboard(): Promise<void> {
    this.isLoading.set(true);
    const [summary] = await Promise.all([this.dashboardFacadeService.getGeneralSummaryData()]);

    this.generalSummary.set(summary);

    this.isLoading.set(false);
  }
}
