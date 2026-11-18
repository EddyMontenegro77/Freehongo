import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuizSessionDetails } from './quiz-session-details';

describe('QuizSessionDetails', () => {
  let component: QuizSessionDetails;
  let fixture: ComponentFixture<QuizSessionDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuizSessionDetails]
    })
      .compileComponents();

    fixture = TestBed.createComponent(QuizSessionDetails);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
