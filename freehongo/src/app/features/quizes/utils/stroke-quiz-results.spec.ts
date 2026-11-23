import { WritingValidationEvent } from '../../../shared/models/quizes/quizes.interface';
import {
  buildOverall,
  buildRows,
  CharacterResult,
  describeResult,
  fromValidation,
  notAttempted,
} from './stroke-quiz-results';

const stroke = (isValid: boolean, errorType = 'none', strokeIndex = 0) =>
  ({ strokeIndex, isValid, errorType }) as WritingValidationEvent['strokeResults'][number];

const correct = (unicode: string): CharacterResult => ({
  unicode,
  attempted: true,
  isValid: true,
  sequenceError: 'none',
  strokeResults: [stroke(true), stroke(true, 'none', 1)],
});

describe('strokes-quiz-results', () => {
  describe('fromValidation', () => {
    it('marks the result as attempted and keeps the validation data', () => {
      const result = fromValidation({
        unicode: '3042',
        isValid: false,
        sequenceError: 'wrong-order',
        strokeResults: [],
      });

      expect(result).toEqual({
        unicode: '3042',
        attempted: true,
        isValid: false,
        sequenceError: 'wrong-order',
        strokeResults: [],
      });
    });
  });

  describe('buildOverall', () => {
    it('counts correct, attempted and not attempted characters', () => {
      const overall = buildOverall([
        correct('3042'),
        { ...correct('3044'), isValid: false },
        notAttempted('3046'),
      ]);

      expect(overall).toEqual({
        total: 3,
        attempted: 2,
        correct: 1,
        notAttempted: 1,
        percentage: 33,
      });
    });

    it('returns 0% for an empty session', () => {
      expect(buildOverall([]).percentage).toBe(0);
    });
  });

  describe('describeResult', () => {
    it('is empty for a correct character', () => {
      expect(describeResult(correct('3042'))).toBe('');
    });

    it('flags characters that were never validated', () => {
      expect(describeResult(notAttempted('3042'))).toBe('Not attempted');
    });

    it('prefers the sequence error over stroke errors', () => {
      const result: CharacterResult = {
        ...correct('3042'),
        isValid: false,
        sequenceError: 'wrong-amount',
        strokeResults: [stroke(false, 'wrong-shape')],
      };

      expect(describeResult(result)).toBe('Wrong number of strokes');
    });

    it('reports the first wrong stroke when the sequence is fine', () => {
      const result: CharacterResult = {
        ...correct('3042'),
        isValid: false,
        strokeResults: [stroke(true), stroke(false, 'wrong-direction', 1)],
      };

      expect(describeResult(result)).toBe('Stroke 2: wrong direction');
    });

    it('falls back to a generic message', () => {
      expect(describeResult({ ...correct('3042'), isValid: false, strokeResults: [] })).toBe(
        'Incorrect',
      );
    });
  });

  describe('buildRows', () => {
    it('builds one row per result using the character converter', () => {
      const rows = buildRows([correct('3042'), notAttempted('3044')], (unicode) => `<${unicode}>`);

      expect(rows).toEqual([
        { character: '<3042>', result: 'Correct:', strokes: '2/2', detail: '—' },
        { character: '<3044>', result: 'Not attempted', strokes: '—', detail: 'Not attempted' },
      ]);
    });
  });
});
