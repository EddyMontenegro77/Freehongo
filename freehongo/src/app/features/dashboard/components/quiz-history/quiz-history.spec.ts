import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuizHistory } from './quiz-history';
import { DashboardFacadeService } from '../../services/dashboard.facade.service';
import { Router } from '@angular/router';

describe('Explore', () => {
  let component: QuizHistory;
  let fixture: ComponentFixture<QuizHistory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuizHistory],
      providers: [
        { provide: DashboardFacadeService, useValue: { fetchQuizSessions: vi.fn().mockResolvedValue([]) } },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(QuizHistory);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
