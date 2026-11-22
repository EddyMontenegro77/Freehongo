import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Dashboard } from './dashboard';
import { DashboardFacadeService } from '../../services/dashboard.facade.service';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard]
      ,providers: [{
        provide: DashboardFacadeService,
        useValue: {
          getGeneralSummaryData: vi.fn().mockResolvedValue({ masteryLevel: 'new', accuracy: 0, totalSessions: 0, dayStreak: 0, averageResponseTimeMs: 0 }),
          getCategoriesProgressData: vi.fn().mockResolvedValue({}),
          getSkillsProgressData: vi.fn().mockResolvedValue({}),
          getCharacterStats: vi.fn().mockResolvedValue([[], []]),
          getTrendsData: vi.fn().mockResolvedValue({ buckets: [] }),
        },
      }]
    })
      .compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
