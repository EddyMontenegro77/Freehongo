import { WritingValidationEvent } from '../../../shared/models/quizes/quizes.interface';

/** Outcome of one character in a strokes quiz session. */
export interface CharacterResult {
  unicode: string;
  attempted: boolean;
  isValid: boolean;
  sequenceError: string;
  strokeResults: WritingValidationEvent['strokeResults'];
}

export interface QuizOverall {
  total: number;
  attempted: number;
  correct: number;
  notAttempted: number;
  percentage: number;
}

/** Row shape rendered by the reusable table (a type alias, so it stays assignable to records). */
export type SummaryRow = {
  character: string;
  result: string;
  strokes: string;
  detail: string;
};

const SEQUENCE_LABELS: Record<string, string> = {
  'wrong-amount': 'Wrong number of strokes',
  'wrong-order': 'Wrong stroke order',
};

const STROKE_LABELS: Record<string, string> = {
  'wrong-direction': 'wrong direction',
  'wrong-shape': 'wrong shape',
};

export function fromValidation(validation: WritingValidationEvent): CharacterResult {
  return {
    unicode: validation.unicode,
    attempted: true,
    isValid: validation.isValid,
    sequenceError: validation.sequenceError,
    strokeResults: validation.strokeResults,
  };
}

export function notAttempted(unicode: string): CharacterResult {
  return { unicode, attempted: false, isValid: false, sequenceError: 'none', strokeResults: [] };
}

/** Counts every character in the list; characters never validated count as not attempted. */
export function buildOverall(results: CharacterResult[]): QuizOverall {
  const total = results.length;
  const attempted = results.filter((result) => result.attempted).length;
  const correct = results.filter((result) => result.attempted && result.isValid).length;

  return {
    total,
    attempted,
    correct,
    notAttempted: total - attempted,
    percentage: total === 0 ? 0 : Math.round((correct / total) * 100),
  };
}

/** Short human-readable reason for a non-correct result (empty when correct). */
export function describeResult(result: CharacterResult): string {
  if (!result.attempted) {
    return 'Not attempted';
  }

  if (result.isValid) {
    return '';
  }

  const sequenceLabel = SEQUENCE_LABELS[result.sequenceError];

  if (sequenceLabel) {
    return sequenceLabel;
  }

  const wrongStroke = result.strokeResults.find((stroke) => !stroke.isValid);

  if (wrongStroke) {
    const label = STROKE_LABELS[wrongStroke.errorType] ?? 'incorrect';
    return `Stroke ${wrongStroke.strokeIndex + 1}: ${label}`;
  }

  return 'Incorrect';
}

export function buildRows(
  results: CharacterResult[],
  toCharacter: (unicode: string) => string,
): SummaryRow[] {
  return results.map((result) => ({
    character: toCharacter(result.unicode),
    result: resultLabel(result),
    strokes: strokeSummary(result),
    detail: describeResult(result) || '—',
  }));
}

function resultLabel(result: CharacterResult): string {
  if (!result.attempted) {
    return 'Not attempted';
  }

  return result.isValid ? 'Correct' : 'Incorrect';
}

function strokeSummary(result: CharacterResult): string {
  if (!result.attempted || result.strokeResults.length === 0) {
    return '—';
  }

  const valid = result.strokeResults.filter((stroke) => stroke.isValid).length;
  return `${valid}/${result.strokeResults.length}`;
}
