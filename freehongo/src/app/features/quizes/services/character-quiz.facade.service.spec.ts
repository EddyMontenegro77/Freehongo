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
  let evaluationStorage: { save: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    listsFacade = { getListById: vi.fn() };
    japaneseService = { getKana: vi.fn(), getKanji: vi.fn() };
    questionService = { createQuestions: vi.fn() };
    evaluationStorage = { save: vi.fn() };

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

  it('saves results only when an evaluation is completed', async () => {
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
      mode: 'evaluation',
      order: 'list',
    });
    facade.submitAnswer('a');
    facade.nextQuestion();

    expect(evaluationStorage.save).toHaveBeenCalledWith(
      expect.objectContaining({ listId: 'list-1', score: 1, total: 1 }),
    );
  });
});
