import { TestBed } from '@angular/core/testing';
import {
  ChoiceAnswerResult,
  ChoiceQuizResult,
  WritingQuizResult,
} from '../../../shared/models/quizes/quizes.interface';
import { StoredCharacterStat } from '../../../shared/models/quizes/quizes-storage.interface';
import { QuizEvaluationStorageService } from './quiz-evaluation-storage.service';
import { DatabaseService } from '../../../core/db/services/database.service';
import { SyncTriggerService } from '../../../core/sync/services/sync-trigger.service';

const STARTED_AT = '2026-09-29T00:00:00.000Z';
const COMPLETED_AT = '2026-09-29T00:05:00.000Z';
const ANSWERED_AT = '2026-09-29T00:01:00.000Z';

const answerA: ChoiceAnswerResult = {
  characterUnicode: '3042',
  expectedAnswer: 'a',
  correct: true,
  responseTimeMs: 1200,
  answeredAt: ANSWERED_AT,
  answer: 'a',
};

const answerB: ChoiceAnswerResult = {
  characterUnicode: '3044',
  expectedAnswer: 'i',
  correct: false,
  responseTimeMs: 2000,
  answeredAt: ANSWERED_AT,
  answer: 'u',
  confusedWith: '3046',
};

function choiceResult(overrides: Partial<ChoiceQuizResult> = {}): ChoiceQuizResult {
  return {
    id: 'session-1',
    listId: 'list-1',
    order: 'random',
    startedAt: STARTED_AT,
    completedAt: COMPLETED_AT,
    score: 1,
    total: 2,
    answerType: 'multiple',
    characterQuizType: 'characterToReading',
    answers: [answerA, answerB],
    ...overrides,
  };
}

function writingResult(overrides: Partial<WritingQuizResult> = {}): WritingQuizResult {
  return {
    id: 'session-2',
    listId: 'list-1',
    order: 'list',
    startedAt: STARTED_AT,
    completedAt: COMPLETED_AT,
    score: 1,
    total: 2,
    answerType: 'strokeWriting',
    answers: [
      {
        characterUnicode: '3042',
        expectedAnswer: '3042',
        correct: true,
        responseTimeMs: 4000,
        answeredAt: ANSWERED_AT,
        writing: { strokeCountCorrect: true, orderCorrect: true, strokeResults: [] },
      },
      {
        characterUnicode: '3044',
        expectedAnswer: '3044',
        correct: false,
        responseTimeMs: 5000,
        answeredAt: ANSWERED_AT,
        writing: { strokeCountCorrect: true, orderCorrect: false, strokeResults: [] },
      },
    ],
    ...overrides,
  };
}

function storedStat(overrides: Partial<StoredCharacterStat> = {}): StoredCharacterStat {
  return {
    unicode: '3042',
    answerType: 'multiple',
    attempts: 3,
    totalResponseMs: 3000,
    correctCount: 2,
    correctStreak: 2,
    firstSeenAt: new Date('2026-09-01T00:00:00.000Z'),
    lastSeenAt: new Date('2026-09-20T00:00:00.000Z'),
    ...overrides,
  };
}

const invalidCases: [string, ChoiceQuizResult, RegExp][] = [
  [
    'fewer than two questions',
    choiceResult({ total: 1, answers: [answerA] }),
    /at least 2 questions/,
  ],
  [
    'the same character answered twice',
    choiceResult({ answers: [answerA, { ...answerA }] }),
    /same character/,
  ],
  [
    'a negative response time',
    choiceResult({ answers: [answerA, { ...answerB, responseTimeMs: -1 }] }),
    /negative/,
  ],
  [
    'a session that finishes before it starts',
    choiceResult({ completedAt: '2026-09-28T00:00:00.000Z' }),
    /finish before it starts/,
  ],
];

describe('QuizEvaluationStorageService', () => {
  let service: QuizEvaluationStorageService;
  let database: {
    quizSessions: { add: ReturnType<typeof vi.fn> };
    quizAnswers: { bulkAdd: ReturnType<typeof vi.fn> };
    characterStats: { bulkGet: ReturnType<typeof vi.fn>; bulkPut: ReturnType<typeof vi.fn> };
    transaction: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    database = {
      quizSessions: { add: vi.fn().mockResolvedValue(undefined) },
      quizAnswers: { bulkAdd: vi.fn().mockResolvedValue(undefined) },
      characterStats: {
        // By default no character has any previous stats.
        bulkGet: vi.fn(async (keys: unknown[]) => keys.map(() => undefined)),
        bulkPut: vi.fn().mockResolvedValue(undefined),
      },
      // Runs the callback like Dexie would; the last argument is always the callback.
      transaction: vi.fn(async (...args: unknown[]) =>
        (args[args.length - 1] as () => Promise<unknown>)(),
      ),
    };

    TestBed.configureTestingModule({
      providers: [
        QuizEvaluationStorageService,
        { provide: DatabaseService, useValue: { database } },
        { provide: SyncTriggerService, useValue: { schedule: vi.fn() } },
      ],
    });
    service = TestBed.inject(QuizEvaluationStorageService);
  });

  describe('sessions and answers', () => {
    it('stores a multiple-choice evaluation as a pending session with its answers', async () => {
      await service.saveEvaluation(choiceResult());

      expect(database.quizSessions.add).toHaveBeenCalledWith({
        quizSessionId: 'session-1',
        listId: 'list-1',
        answerType: 'multiple',
        characterQuizType: 'characterToReading',
        startedAt: new Date(STARTED_AT),
        finishedAt: new Date(COMPLETED_AT),
        totalQuestions: 2,
        randomOrder: true,
        syncStatus: 'pending',
      });
      expect(database.quizAnswers.bulkAdd).toHaveBeenCalledWith([
        {
          quizSessionId: 'session-1',
          unicode: '3042',
          responseTimeMs: 1200,
          isCorrect: true,
          givenAnswer: 'a',
          expectedAnswer: 'a',
          answeredAt: new Date(ANSWERED_AT),
        },
        {
          quizSessionId: 'session-1',
          unicode: '3044',
          responseTimeMs: 2000,
          isCorrect: false,
          givenAnswer: 'u',
          expectedAnswer: 'i',
          confusedWith: '3046',
          answeredAt: new Date(ANSWERED_AT),
        },
      ]);
    });

    it('maps the list order to a false randomOrder flag', async () => {
      await service.saveEvaluation(choiceResult({ order: 'list' }));

      expect(database.quizSessions.add).toHaveBeenCalledWith(
        expect.objectContaining({ randomOrder: false }),
      );
    });

    it('stores a stroke-writing evaluation without a quiz type or text answers', async () => {
      await service.saveEvaluation(writingResult());

      const [session] = database.quizSessions.add.mock.calls[0];
      expect(session.answerType).toBe('strokeWriting');
      expect(session.characterQuizType).toBeUndefined();

      const [answers] = database.quizAnswers.bulkAdd.mock.calls[0];
      expect(answers).toHaveLength(2);
      expect(answers[0]).toMatchObject({
        unicode: '3042',
        isCorrect: true,
        writingAttempt: { strokeCountCorrect: true, orderCorrect: true, strokeResults: [] },
      });
      expect(answers[1].writingAttempt.orderCorrect).toBe(false);
      expect(answers[0].givenAnswer).toBeUndefined();
    });
  });

  describe('character stats', () => {
    it('creates the stats of characters seen for the first time', async () => {
      await service.saveEvaluation(choiceResult());

      expect(database.characterStats.bulkPut).toHaveBeenCalledWith([
        {
          unicode: '3042',
          answerType: 'multiple',
          attempts: 1,
          totalResponseMs: 1200,
          correctCount: 1,
          correctStreak: 1,
          firstSeenAt: new Date(ANSWERED_AT),
          lastSeenAt: new Date(ANSWERED_AT),
        },
        {
          unicode: '3044',
          answerType: 'multiple',
          attempts: 1,
          totalResponseMs: 2000,
          correctCount: 0,
          correctStreak: 0,
          firstSeenAt: new Date(ANSWERED_AT),
          lastSeenAt: new Date(ANSWERED_AT),
        },
      ]);
    });

    it('accumulates onto the existing stats and keeps the first time it was seen', async () => {
      database.characterStats.bulkGet.mockResolvedValue([storedStat(), undefined]);

      await service.saveEvaluation(choiceResult());

      const [updated] = database.characterStats.bulkPut.mock.calls[0];
      expect(updated[0]).toEqual({
        unicode: '3042',
        answerType: 'multiple',
        attempts: 4,
        totalResponseMs: 4200,
        correctCount: 3,
        correctStreak: 3,
        firstSeenAt: new Date('2026-09-01T00:00:00.000Z'),
        lastSeenAt: new Date(ANSWERED_AT),
      });
    });

    it('resets the streak on a wrong answer but keeps the other counters growing', async () => {
      database.characterStats.bulkGet.mockResolvedValue([
        undefined,
        storedStat({ unicode: '3044', attempts: 5, correctCount: 5, correctStreak: 5 }),
      ]);

      await service.saveEvaluation(choiceResult());

      const [updated] = database.characterStats.bulkPut.mock.calls[0];
      expect(updated[1]).toMatchObject({
        unicode: '3044',
        attempts: 6,
        correctCount: 5,
        correctStreak: 0,
      });
    });

    it('looks up the stats by character and answer type', async () => {
      await service.saveEvaluation(choiceResult({ answerType: 'open' }));
      expect(database.characterStats.bulkGet).toHaveBeenLastCalledWith([
        ['3042', 'open'],
        ['3044', 'open'],
      ]);

      await service.saveEvaluation(writingResult());
      expect(database.characterStats.bulkGet).toHaveBeenLastCalledWith([
        ['3042', 'strokeWriting'],
        ['3044', 'strokeWriting'],
      ]);
    });

    it('keeps the stats of the same character separate for each answer type', async () => {
      await service.saveEvaluation(writingResult());

      const [updated] = database.characterStats.bulkPut.mock.calls[0];
      expect(
        updated.every((stat: StoredCharacterStat) => stat.answerType === 'strokeWriting'),
      ).toBe(true);
    });
  });

  describe('transaction', () => {
    it('writes the session, its answers and the stats in a single transaction', async () => {
      await service.saveEvaluation(choiceResult());

      expect(database.transaction).toHaveBeenCalledTimes(1);
      expect(database.transaction).toHaveBeenCalledWith(
        'rw',
        database.quizSessions,
        database.quizAnswers,
        database.characterStats,
        expect.any(Function),
      );
    });

    it('propagates a failed answers write so the caller can report it', async () => {
      database.quizAnswers.bulkAdd.mockRejectedValue(new Error('disk full'));

      await expect(service.saveEvaluation(choiceResult())).rejects.toThrow('disk full');
    });

    it('propagates a failed stats write so the transaction can roll back', async () => {
      database.characterStats.bulkPut.mockRejectedValue(new Error('quota exceeded'));

      await expect(service.saveEvaluation(choiceResult())).rejects.toThrow('quota exceeded');
    });
  });

  describe('validation', () => {
    it.each(invalidCases)(
      'rejects %s without touching the database',
      async (_name, result, message) => {
        await expect(service.saveEvaluation(result)).rejects.toThrow(message);

        expect(database.transaction).not.toHaveBeenCalled();
        expect(database.quizSessions.add).not.toHaveBeenCalled();
        expect(database.quizAnswers.bulkAdd).not.toHaveBeenCalled();
        expect(database.characterStats.bulkPut).not.toHaveBeenCalled();
      },
    );
  });
});
