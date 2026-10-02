import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuizConfigWindow } from './quiz-config-window';

describe('QuizConfigWindow', () => {
  let component: QuizConfigWindow;
  let fixture: ComponentFixture<QuizConfigWindow>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuizConfigWindow]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuizConfigWindow);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('exposes the supported quiz configuration options', () => {
    expect(component.modeOptions).toHaveLength(2);
    expect(component.quizTypeOptions).toHaveLength(4);
    expect(component.answerTypeOptions).toHaveLength(2);
    expect(component.orderOptions).toHaveLength(2);
  });

  it('emits the selected settings when submitted', () => {
    const submitted = vi.fn();
    component.configSubmitted.subscribe(submitted);
    (component as any).modal = { close: vi.fn() };
    component.mode = 'evaluation';
    component.quizType = 'readingToCharacter';
    component.answerType = 'open';
    component.order = 'list';

    component.submit();

    expect(submitted).toHaveBeenCalledWith({
      mode: 'evaluation',
      characterQuizType: 'readingToCharacter',
      answerType: 'open',
      order: 'list',
    });
  });
});
