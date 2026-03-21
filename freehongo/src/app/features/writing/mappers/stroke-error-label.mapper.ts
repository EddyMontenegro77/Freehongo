import { StrokeErrorType } from '../models/stroke-validation-result.interface';

export const strokeErrorLabel = (errorType: StrokeErrorType): string => {
  switch (errorType) {
    case 'wrong-direction':
      return 'Stroke direction is incorrect';
    case 'wrong-shape':
      return 'Stroke shape does not match';
    case 'none':
    default:
      return 'Stroke is correct';
  }
};
