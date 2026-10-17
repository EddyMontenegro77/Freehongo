import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { StrokesQuiz } from './strokes-quiz';
import { ListService } from '../../../lists/services/list.service';
import { QuizEvaluationStorageService } from '../../services/quiz-evaluation-storage.service';
import { WritingValidationEvent } from '../../../../shared/models/quizes/quizes.interface';
import { shortenUuid } from '../../../../shared/utils/urls.utils';

const LIST_ID = '0197f2a4-7c1e-7a55-9d3e-5b2f8c1a4e60';

interface SetupOptions {
  mode?: string;
  order?: string;
  characters?: string[];
}

function validation(unicode: string, isValid: boolean): WritingValidationEvent {
  return {
    unicode,
    isValid,
    sequenceError: isValid ? '' : 'wrong order',
    strokeResults: [],
  };
}

/**
 * Creates the component and runs ngOnInit by hand, so the template (and the real
 * writing canvas) is never rendered and the tests only exercise the quiz logic.
 */
async function setup({
  mode = 'evaluation',
  order = 'list',
  characters = ['3042', '3044'],
}: SetupOptions = {}) {
  const params: Record<string, string> = { mode, listId: shortenUuid(LIST_ID) };
  const query: Record<string, string> = { order };

  const listService = {
    getListById: vi.fn().mockResolvedValue({
      listId: LIST_ID,
      name: 'Kana',
      type: 'hiragana',
      characters,
    }),
  };
  const evaluationStorage = { saveEvaluation: vi.fn().mockResolvedValue(undefined) };

  await TestBed.configureTestingModule({
    imports: [StrokesQuiz],
    providers: [
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            paramMap: { get: (key: string) => params[key] ?? null },
            queryParamMap: { get: (key: string) => query[key] ?? null },
          },
        },
      },
      { provide: ListService, useValue: listService },
      { provide: QuizEvaluationStorageService, useValue: evaluationStorage },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(StrokesQuiz);
  const component = fixture.componentInstance;
  await component.ngOnInit();

  return { component, listService, evaluationStorage };
}

describe('StrokesQuiz', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create and start a session with the characters of the list', async () => {
    const { component } = await setup({ mode: 'practice' });

    expect(component).toBeTruthy();
    expect(component.isReady()).toBe(true);
    expect(component.currentCharacter()).toBe('3042');
    expect(component.progressLabel()).toBe('1 / 2');
  });

  it('does not start when the list has fewer than two characters', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const { component } = await setup({ characters: ['3042'] });

    expect(component.isReady()).toBe(false);
  });

  it('does not save a practice session', async () => {
    const { component, evaluationStorage } = await setup({ mode: 'practice' });

    component.onValidationCompleted(validation('3042', true));
    component.onValidationCompleted(validation('3044', true));
    await component.finish();

    expect(component.isFinished()).toBe(true);
    expect(evaluationStorage.saveEvaluation).not.toHaveBeenCalled();
  });

  it('saves an evaluation with one answer per character', async () => {
    const { component, evaluationStorage } = await setup({ mode: 'evaluation' });

    component.onValidationCompleted(validation('3042', true));
    component.onValidationCompleted(validation('3044', false));
    await component.finish();

    expect(evaluationStorage.saveEvaluation).toHaveBeenCalledTimes(1);

    const saved = evaluationStorage.saveEvaluation.mock.calls[0][0];
    expect(saved).toMatchObject({
      listId: LIST_ID,
      answerType: 'strokeWriting',
      order: 'list',
      score: 1,
      total: 2,
    });
    expect(saved.id).toEqual(expect.any(String));
    expect(saved.answers.map((answer: any) => answer.characterUnicode)).toEqual(['3042', '3044']);
    expect(saved.answers[1]).toMatchObject({
      correct: false,
      expectedAnswer: '3044',
      writing: { orderCorrect: false },
    });
    expect(saved.answers[0].responseTimeMs).toBeGreaterThanOrEqual(0);
  });

  it('does not store a character quiz type for stroke writing', async () => {
    const { component, evaluationStorage } = await setup({ mode: 'evaluation' });

    component.onValidationCompleted(validation('3042', true));
    component.onValidationCompleted(validation('3044', true));
    await component.finish();

    const saved = evaluationStorage.saveEvaluation.mock.calls[0][0];
    expect('characterQuizType' in saved).toBe(false);
  });

  it('keeps only the latest validation of each character', async () => {
    const { component, evaluationStorage } = await setup({ mode: 'evaluation' });

    component.onValidationCompleted(validation('3042', false));
    component.onValidationCompleted(validation('3042', true));
    component.onValidationCompleted(validation('3044', false));
    await component.finish();

    const saved = evaluationStorage.saveEvaluation.mock.calls[0][0];
    expect(saved.answers).toHaveLength(2);
    expect(saved.score).toBe(1);
    expect(saved.answers[0].correct).toBe(true);
  });

  it('does not save the same evaluation twice', async () => {
    const { component, evaluationStorage } = await setup({ mode: 'evaluation' });

    component.onValidationCompleted(validation('3042', true));
    component.onValidationCompleted(validation('3044', true));
    await component.finish();
    await component.finish();

    expect(evaluationStorage.saveEvaluation).toHaveBeenCalledTimes(1);
  });

  it('flags a failed save but still shows the summary', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { component, evaluationStorage } = await setup({ mode: 'evaluation' });
    evaluationStorage.saveEvaluation.mockRejectedValue(new Error('disk full'));

    component.onValidationCompleted(validation('3042', true));
    component.onValidationCompleted(validation('3044', true));
    await component.finish();

    expect(component.isFinished()).toBe(true);
    expect(component.saveFailed()).toBe(true);
  });

  it('starts from scratch when the quiz is retried', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { component, evaluationStorage } = await setup({ mode: 'evaluation' });
    evaluationStorage.saveEvaluation.mockRejectedValue(new Error('disk full'));

    component.onValidationCompleted(validation('3042', true));
    component.onValidationCompleted(validation('3044', true));
    await component.finish();
    component.retry();

    expect(component.isFinished()).toBe(false);
    expect(component.saveFailed()).toBe(false);
    expect(component.progressLabel()).toBe('1 / 2');
    expect(component.orderedResults().every((result) => result !== undefined)).toBe(true);
  });
});
