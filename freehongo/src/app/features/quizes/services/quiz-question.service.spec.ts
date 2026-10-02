import { TestBed } from '@angular/core/testing';

import { QuizQuestionService } from './quiz-question.service';

describe('QuizQuestionService', () => {
  let service: QuizQuestionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QuizQuestionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('creates reading questions with distractors from the same pool', () => {
    const characters = [
      {
        kind: 'kana' as const,
        unicode: '3042',
        literal: 'あ',
        type: 'hiragana',
        stroke_count: 3,
        reading: 'a',
      },
      {
        kind: 'kana' as const,
        unicode: '3044',
        literal: 'い',
        type: 'hiragana',
        stroke_count: 2,
        reading: 'i',
      },
    ];

    const questions = service.createQuestions(characters, 'characterToReading', 'list');

    expect(questions).toHaveLength(2);
    expect(questions[0].acceptedAnswers).toEqual(['a']);
    expect(questions[0].options?.map((option) => option.value)).toContain('a');
    expect(questions[0].options?.map((option) => option.value)).toContain('i');
  });

  it('creates meaning questions only for kanji', () => {
    const characters = [
      {
        kind: 'kanji' as const,
        unicode: '5B66',
        literal: '学',
        stroke_count: 8,
        readings: { onyomi: ['ガク'] },
        meanings: { en: ['study'] },
        nanori: [],
      },
    ];

    const questions = service.createQuestions(characters, 'characterToMeaning', 'list');

    expect(questions[0].acceptedAnswers).toEqual(['study']);
    expect(questions[0].prompt).toContain('学');
  });

  it('skips kana characters for meaning quizzes in mixed pools', () => {
    const characters = [
      {
        kind: 'kana' as const,
        unicode: '3042',
        literal: 'あ',
        type: 'hiragana',
        stroke_count: 3,
        reading: 'a',
      },
      {
        kind: 'kanji' as const,
        unicode: '5B66',
        literal: '学',
        stroke_count: 8,
        readings: { onyomi: ['ガク'] },
        meanings: { en: ['study'] },
        nanori: [],
      },
    ];

    const questions = service.createQuestions(characters, 'meaningToCharacter', 'list');

    expect(questions).toHaveLength(1);
    expect(questions[0].characterUnicode).toBe('5B66');
  });

  it('uses the reading or meaning as the prompt for reverse questions', () => {
    const character = {
      kind: 'kanji' as const,
      unicode: '5B66',
      literal: '学',
      stroke_count: 8,
      readings: { onyomi: ['ガク'] },
      meanings: { en: ['study'] },
      nanori: [],
    };

    expect(service.createQuestions([character], 'readingToCharacter', 'list')[0].prompt).toContain(
      'ガク',
    );
    expect(service.createQuestions([character], 'meaningToCharacter', 'list')[0].prompt).toContain(
      'study',
    );
  });
});
