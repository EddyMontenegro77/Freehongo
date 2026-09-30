import { TestBed } from '@angular/core/testing';
import { QuizEvaluationStorageService } from './quiz-evaluation-storage.service';

describe('QuizEvaluationStorageService', () => {
  let service: QuizEvaluationStorageService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [QuizEvaluationStorageService] });
    service = TestBed.inject(QuizEvaluationStorageService);
  });

  it('saves and reads evaluation results', () => {
    const result = {
      id: 'result-1',
      listId: 'list-1',
      characterQuizType: 'characterToReading' as const,
      answerType: 'multiple' as const,
      order: 'random' as const,
      startedAt: '2026-09-29T00:00:00.000Z',
      completedAt: '2026-09-29T00:05:00.000Z',
      score: 1,
      total: 1,
      answers: [{ characterUnicode: '3042', answer: 'a', correct: true }],
    };

    service.save(result);

    expect(service.getAll()).toEqual([result]);
  });
});
