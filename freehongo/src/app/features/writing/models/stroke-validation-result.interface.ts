import { Stroke } from './stroke.model';

export interface StrokeValidationResult {
  strokeIndex: number;
  isValid: boolean;
  inputStroke: Stroke;
  expectedStroke: Stroke;
  errorType: StrokeErrorType;
}

export interface SequenceValidationResult {
  isValidSequence: boolean;
  sequenceErrorType: SequenceErrorType;
  strokeResults: StrokeValidationResult[];
}

export type StrokeErrorType = 'none' | 'wrong-direction' | 'wrong-shape';

export type SequenceErrorType = 'none' | 'wrong-amount' | 'wrong-order';
