import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardStatsService } from './dashboard-stats.service';

describe('DashboardStatsService', () => {
  let component: DashboardStatsService;
  let fixture: ComponentFixture<DashboardStatsService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardStatsService]
    })
      .compileComponents();

    fixture = TestBed.createComponent(DashboardStatsService);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
