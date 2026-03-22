import { SequenceErrorType } from '../models/stroke-validation-result.interface';

export const sequenceErrorLabel = (errorType: SequenceErrorType): string => {
  switch (errorType) {
    case 'wrong-amount':
      return 'Wrong number of strokes';
    case 'wrong-order':
      return 'Stroke order is incorrect';
    case 'none':
    default:
      return '';
  }
};
