import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StrokesQuizSummary } from './stroke-quiz-summary';
import { CharacterResult, notAttempted } from '../../utils/stroke-quiz-results';
import { QuizMode } from '../../../../shared/models/quizes/quizes.interface';

const RESULTS: CharacterResult[] = [
  { unicode: '3042', attempted: true, isValid: true, sequenceError: 'none', strokeResults: [] },
  {
    unicode: '3044',
    attempted: true,
    isValid: false,
    sequenceError: 'wrong-order',
    strokeResults: [],
  },
  notAttempted('3046'),
];

describe('StrokesQuizSummary', () => {
  let fixture: ComponentFixture<StrokesQuizSummary>;
  let component: StrokesQuizSummary;

  function setup(mode: QuizMode): void {
    fixture = TestBed.createComponent(StrokesQuizSummary);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('mode', mode);
    fixture.componentRef.setInput('results', RESULTS);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [StrokesQuizSummary] }).compileComponents();
  });

  it('shows only the overall score in practice', () => {
    setup('practice');

    const text: string = fixture.nativeElement.textContent;

    expect(text).toContain('Practice complete');
    expect(text).toContain('1 / 3');
    expect(text).toContain('1 not attempted');
    expect(fixture.nativeElement.querySelector('app-table')).toBeNull();
  });

  it('shows the overall score and a breakdown table in evaluation', () => {
    setup('evaluation');

    const text: string = fixture.nativeElement.textContent;

    expect(text).toContain('Evaluation complete');
    expect(text).toContain('1 / 3');
    expect(fixture.nativeElement.querySelectorAll('tbody tr')).toHaveLength(3);
    expect(text).toContain('Wrong stroke order');
    expect(text).toContain('Not attempted');
  });

  it('emits retry and exit requests', () => {
    setup('practice');
    const retry = vi.fn();
    const exit = vi.fn();
    component.retryRequested.subscribe(retry);
    component.exitRequested.subscribe(exit);

    component.retry();
    component.exit();

    expect(retry).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledTimes(1);
  });
});
