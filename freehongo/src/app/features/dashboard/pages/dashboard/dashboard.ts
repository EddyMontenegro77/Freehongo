import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Milestone } from '../../../../shared/components/progressbar/progressbar';
import { LoadingState } from '../../../../shared/components/app-state/loading-state/loading-state';
import { Summary } from '../../components/summary/summary';
import {
  CategoryProgress,
  DashboardCategory,
  DashboardSkill,
  GeneralSummary,
  PracticedCharacter,
  SkillProgress,
  TrendsData,
} from '../../models/dashboard.models';
import { DashboardFacadeService } from '../../services/dashboard.facade.service';
import { Categories } from '../../components/categories/categories';
import { Skills } from '../../components/skills/skills';
import { QuizHistory } from '../../components/quiz-history/quiz-history';
import { StoredCharacterStat } from '../../../../shared/models/quizes/quizes-storage.interface';
import { WeakChars } from '../../components/weak-chars/weak-chars';
import { MasterDetails } from '../../components/master-details/master-details';
import { Trends } from '../../components/trends/trends';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    LoadingState,
    Summary,
    Categories,
    Skills,
    QuizHistory,
    WeakChars,
    MasterDetails,
    Trends,
  ],
  selector: 'app-dashboard',
  styleUrl: './dashboard.scss',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private readonly dashboardFacadeService = inject(DashboardFacadeService);

  readonly dashboardSections = [
    { id: 'dashboard-overview', label: 'Overview' },
    { id: 'dashboard-categories', label: 'Categories' },
    { id: 'dashboard-skills', label: 'Skills' },
    { id: 'dashboard-trends', label: 'Trends' },
    { id: 'dashboard-weak-characters', label: 'Weak characters' },
    { id: 'dashboard-practiced-characters', label: 'Characters' },
    { id: 'dashboard-quiz-history', label: 'Quiz history' },
  ] as const;

  readonly generalSummary = signal<GeneralSummary | null>(null);
  readonly categoriesProgress = signal<Record<DashboardCategory, CategoryProgress> | null>(null);
  readonly skillsProgress = signal<Record<DashboardSkill, SkillProgress> | null>(null);
  readonly practicedCharacters = signal<PracticedCharacter[]>([]);
  readonly weakCharacters = signal<StoredCharacterStat[]>([]);
  readonly trends = signal<TrendsData>({ buckets: [] });

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

  scrollToSection(event: MouseEvent, sectionId: string): void {
    event.preventDefault();
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  ngOnInit(): void {
    this.loadDashboard();
  }

  async loadDashboard(): Promise<void> {
    this.isLoading.set(true);
    const [summary, categories, skills, [practicedCharacters, weakCharacters], trends] =
      await Promise.all([
        this.dashboardFacadeService.getGeneralSummaryData(),
        this.dashboardFacadeService.getCategoriesProgressData(),
        this.dashboardFacadeService.getSkillsProgressData(),
        this.dashboardFacadeService.getCharacterStats(),
        this.dashboardFacadeService.getTrendsData(),
      ]);

    this.generalSummary.set(summary);
    this.categoriesProgress.set(categories);
    this.skillsProgress.set(skills);
    this.practicedCharacters.set(practicedCharacters);
    this.weakCharacters.set(weakCharacters);
    this.trends.set(trends);

    this.isLoading.set(false);
  }
}
