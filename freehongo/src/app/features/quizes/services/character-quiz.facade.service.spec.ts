import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CharacterQuizFacade } from './character-quiz.facade.service';
import { JapaneseService } from '../../../shared/services/japanese/japanese.service';
import { ListsFacade } from '../../lists/services/lists.facade.service';
import { QuizQuestionService } from './quiz-question.service';
import { QuizEvaluationStorageService } from './quiz-evaluation-storage.service';

describe('CharacterQuizFacade', () => {
  let facade: CharacterQuizFacade;
  let listsFacade: { getListById: ReturnType<typeof vi.fn> };
  let japaneseService: {
    getKana: ReturnType<typeof vi.fn>;
    getKanji: ReturnType<typeof vi.fn>;
  };
  let questionService: { createQuestions: ReturnType<typeof vi.fn> };
  let evaluationStorage: { saveEvaluation: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    listsFacade = { getListById: vi.fn() };
    japaneseService = { getKana: vi.fn(), getKanji: vi.fn() };
    questionService = { createQuestions: vi.fn() };
    evaluationStorage = { saveEvaluation: vi.fn().mockResolvedValue(undefined) };

    TestBed.configureTestingModule({
      providers: [
        CharacterQuizFacade,
        { provide: ListsFacade, useValue: listsFacade },
        { provide: JapaneseService, useValue: japaneseService },
        { provide: QuizQuestionService, useValue: questionService },
        { provide: QuizEvaluationStorageService, useValue: evaluationStorage },
      ],
    });

    facade = TestBed.inject(CharacterQuizFacade);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  /** Loads a one-question quiz in the given mode, ready to be answered. */
  async function loadQuiz(mode: 'practice' | 'evaluation'): Promise<void> {
    listsFacade.getListById.mockResolvedValue({
      listId: 'list-1',
      name: 'Kana',
      type: 'hiragana',
      characters: ['3042', '3044'],
    });
    japaneseService.getKana.mockReturnValue(
      of({ unicode: '3042', literal: 'あ', type: 'hiragana', stroke_count: 3, reading: 'a' }),
    );
    questionService.createQuestions.mockReturnValue([
      { prompt: 'Question', acceptedAnswers: ['a'], characterUnicode: '3042' },
    ]);

    await facade.load({
      listId: 'list-1',
      characterQuizType: 'characterToReading',
      answerType: 'multiple',
      mode,
      order: 'list',
    });
  }

  it('loads a list and generates questions', async () => {
    listsFacade.getListById.mockResolvedValue({
      listId: 'list-1',
      name: 'Kana',
      type: 'hiragana',
      characters: ['3042', '3044'],
    });
    japaneseService.getKana.mockReturnValue(
      of({ unicode: '3042', literal: 'あ', type: 'hiragana', stroke_count: 3, reading: 'a' }),
    );
    questionService.createQuestions.mockReturnValue([
      {
        prompt: 'What is the reading of あ?',
        acceptedAnswers: ['a'],
        characterUnicode: '3042',
        options: [{ value: 'a', label: 'a' }],
      },
    ]);

    await facade.load({
      listId: 'list-1',
      characterQuizType: 'characterToReading',
      answerType: 'multiple',
      mode: 'practice',
      order: 'list',
    });

    expect(facade.questions()).toHaveLength(1);
    expect(facade.error()).toBeNull();
    expect(facade.isLoading()).toBe(false);
  });

  it('marks an empty list for confirmation instead of starting', async () => {
    listsFacade.getListById.mockResolvedValue({
      listId: 'empty',
      name: 'Empty',
      type: 'mixed',
      characters: [],
    });

    await facade.load({
      listId: 'empty',
      characterQuizType: 'characterToReading',
      answerType: 'open',
      mode: 'practice',
      order: 'random',
    });

    expect(facade.emptyList()).toBe(true);
    expect(facade.questions()).toEqual([]);
  });

  it('rejects a quiz list with fewer than two characters', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    listsFacade.getListById.mockResolvedValue({
      listId: 'short',
      name: 'Short list',
      type: 'mixed',
      characters: ['3042'],
    });

    await facade.load({
      listId: 'short',
      characterQuizType: 'characterToReading',
      answerType: 'multiple',
      mode: 'practice',
      order: 'random',
    });

    expect(facade.error()).toBe('A quiz list must contain at least 2 characters.');
    expect(facade.questions()).toEqual([]);
    expect(japaneseService.getKana).not.toHaveBeenCalled();
  });

  it('normalizes open answers before comparing them', () => {
    facade.questions.set([
      {
        prompt: 'Answer',
        acceptedAnswers: ['がく'],
        characterUnicode: '5B66',
      },
    ]);

    facade.submitAnswer('  ガク ');

    expect(facade.lastAnswerCorrect()).toBe(true);
    expect(facade.score()).toBe(1);
  });

  it('accepts romaji when the expected answer is a Japanese reading', () => {
    facade.questions.set([
      {
        prompt: 'Answer',
        acceptedAnswers: ['がく'],
        characterUnicode: '5B66',
      },
    ]);

    facade.submitAnswer('gaku');

    expect(facade.lastAnswerCorrect()).toBe(true);
    expect(facade.score()).toBe(1);
  });

  it('does not convert English meanings to Japanese readings', () => {
    facade.questions.set([
      {
        prompt: 'Answer',
        acceptedAnswers: ['study'],
        characterUnicode: '5B66',
      },
    ]);

    facade.submitAnswer('スタディ');

    expect(facade.lastAnswerCorrect()).toBe(false);
    expect(facade.score()).toBe(0);
  });

  it('records the expected answer and the time taken for each answer', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-16T10:00:00.000Z'));
    await loadQuiz('evaluation');

    vi.setSystemTime(new Date('2026-10-16T10:00:01.500Z'));
    facade.submitAnswer('a');

    expect(facade.answers()[0]).toMatchObject({
      characterUnicode: '3042',
      answer: 'a',
      expectedAnswer: 'a',
      correct: true,
      responseTimeMs: 1500,
      answeredAt: '2026-10-16T10:00:01.500Z',
    });
  });

  it('saves the result when an evaluation is completed', async () => {
    await loadQuiz('evaluation');
    facade.submitAnswer('a');
    facade.nextQuestion();

    expect(facade.isFinished()).toBe(true);
    expect(evaluationStorage.saveEvaluation).toHaveBeenCalledTimes(1);

    const saved = evaluationStorage.saveEvaluation.mock.calls[0][0];
    expect(saved).toMatchObject({
      listId: 'list-1',
      answerType: 'multiple',
      characterQuizType: 'characterToReading',
      order: 'list',
      score: 1,
      total: 1,
    });
    expect(saved.id).toEqual(expect.any(String));
    expect(saved.answers[0]).toMatchObject({
      characterUnicode: '3042',
      answer: 'a',
      expectedAnswer: 'a',
      correct: true,
    });
  });

  it('does not save a practice session', async () => {
    await loadQuiz('practice');
    facade.submitAnswer('a');
    facade.nextQuestion();

    expect(facade.isFinished()).toBe(true);
    expect(evaluationStorage.saveEvaluation).not.toHaveBeenCalled();
  });

  it('does not save the same evaluation twice', async () => {
    await loadQuiz('evaluation');
    facade.submitAnswer('a');
    facade.nextQuestion();
    facade.nextQuestion();

    expect(evaluationStorage.saveEvaluation).toHaveBeenCalledTimes(1);
  });

  it('flags a failed save without hiding the result', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    evaluationStorage.saveEvaluation.mockRejectedValue(new Error('disk full'));

    await loadQuiz('evaluation');
    facade.submitAnswer('a');
    facade.nextQuestion();

    await vi.waitFor(() => expect(facade.saveFailed()).toBe(true));
    expect(facade.isFinished()).toBe(true);
    expect(facade.error()).toBeNull();
  });
});
