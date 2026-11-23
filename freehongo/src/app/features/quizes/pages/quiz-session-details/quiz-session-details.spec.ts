import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { QuizSessionDetails } from './quiz-session-details';

describe('QuizSessionDetails', () => {
  let component: QuizSessionDetails;
  let fixture: ComponentFixture<QuizSessionDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuizSessionDetails],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ sessionId: 'session-1' }) } },
        },
      ],
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
