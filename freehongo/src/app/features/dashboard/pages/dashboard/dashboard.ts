import { Component, inject, signal } from '@angular/core';
import { Milestone, Progressbar } from '../../../../shared/components/progressbar/progressbar';
import { LoadingState } from '../../../../shared/components/app-state/loading-state/loading-state';
import { Summary } from '../../components/summary/summary';
import {
  CategoryProgress,
  DashboardCategory,
  DashboardSkill,
  GeneralSummary,
  PracticedCharacter,
  SkillProgress,
} from '../../models/dashboard.models';
import { DashboardFacadeService } from '../../services/dashboard.facade.service';
import { Categories } from '../../components/categories/categories';
import { Skills } from '../../components/skills/skills';
import { QuizHistory } from '../../components/quiz-history/quiz-history';
import { StoredCharacterStat } from '../../../../shared/models/quizes/quizes-storage.interface';
import { WeakChars } from '../../components/weak-chars/weak-chars';
import { MasterDetails } from '../../components/master-details/master-details';

@Component({
  imports: [
    Progressbar,
    LoadingState,
    Summary,
    Categories,
    Skills,
    QuizHistory,
    WeakChars,
    MasterDetails,
  ],
  selector: 'app-dashboard',
  styleUrl: './dashboard.scss',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private readonly dashboardFacadeService = inject(DashboardFacadeService);

  readonly generalSummary = signal<GeneralSummary | null>(null);
  readonly categoriesProgress = signal<Record<DashboardCategory, CategoryProgress> | null>(null);
  readonly skillsProgress = signal<Record<DashboardSkill, SkillProgress> | null>(null);
  readonly practicedCharacters = signal<PracticedCharacter[]>([]);
  readonly weakCharacters = signal<StoredCharacterStat[]>([]);

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
    const [summary, categories, skills, [practicedCharacters, weakCharacters]] = await Promise.all([
      this.dashboardFacadeService.getGeneralSummaryData(),
      this.dashboardFacadeService.getCategoriesProgressData(),
      this.dashboardFacadeService.getSkillsProgressData(),
      this.dashboardFacadeService.getCharacterStats(),
    ]);

    this.generalSummary.set(summary);
    this.categoriesProgress.set(categories);
    this.skillsProgress.set(skills);
    this.practicedCharacters.set(practicedCharacters);
    this.weakCharacters.set(weakCharacters);
    this.isLoading.set(false);
  }
}
