import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StrokesQuiz } from './strokes-quiz';

describe('StrokesQuiz', () => {
  let component: StrokesQuiz;
  let fixture: ComponentFixture<StrokesQuiz>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StrokesQuiz]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StrokesQuiz);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
