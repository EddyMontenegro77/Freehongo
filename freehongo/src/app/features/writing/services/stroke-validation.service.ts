import { Injectable } from '@angular/core';
import { Stroke } from '../models/stroke.model';
import {
  SequenceErrorType,
  SequenceValidationResult,
  StrokeErrorType,
  StrokeValidationResult,
} from '../models/stroke-validation-result.interface';

@Injectable({
  providedIn: 'root',
})
export class StrokeValidationService {
  validateStroke(
    inputStroke: Stroke,
    expectedStroke: Stroke,
    strokeIndex: number,
  ): StrokeValidationResult {
    const validationResult: StrokeErrorType = this.resolveStrokeError(inputStroke, expectedStroke);
    const isValid = validationResult === 'none';

    const strokeResult: StrokeValidationResult = {
      strokeIndex: strokeIndex,
      isValid: isValid,
      inputStroke: inputStroke,
      expectedStroke: expectedStroke,
      errorType: validationResult,
    };
    return strokeResult;
  }

  validateSequence(inputStrokes: Stroke[], expectedStrokes: Stroke[]): SequenceValidationResult {
    const { strokesResults, hasInvalidStroke } = this.buildStrokeResults(
      inputStrokes,
      expectedStrokes,
    );

    const sequenceValidationResult = this.resolveSequenceError(inputStrokes, expectedStrokes);

    const isValidSequence = sequenceValidationResult === 'none' && !hasInvalidStroke;

    const sequenceResults: SequenceValidationResult = {
      isValidSequence: isValidSequence,
      sequenceErrorType: sequenceValidationResult,
      strokeResults: strokesResults,
    };

    return sequenceResults;
  }

  private buildStrokeResults(
    inputStrokes: Stroke[],
    expectedStrokes: Stroke[],
  ): { strokesResults: StrokeValidationResult[]; hasInvalidStroke: boolean } {
    const strokesResults = new Array<StrokeValidationResult>();
    let hasInvalidStroke = false;

    const iterationBoundary = Math.min(inputStrokes.length, expectedStrokes.length);

    for (let strokeIndex = 0; strokeIndex < iterationBoundary; strokeIndex++) {
      const validationResult = this.validateStroke(
        inputStrokes[strokeIndex],
        expectedStrokes[strokeIndex],
        strokeIndex,
      );
      if (!validationResult.isValid) hasInvalidStroke = true;
      strokesResults.push(validationResult);
    }

    return { strokesResults, hasInvalidStroke };
  }

  private resolveStrokeError(input: Stroke, expected: Stroke): StrokeErrorType {
    const directionError = this.validateStrokeDirection(input, expected);
    if (directionError !== 'none') return directionError;

    const shapeError = this.validateStrokeShape(input, expected);
    if (shapeError !== 'none') return shapeError;

    return 'none';
  }

  private resolveSequenceError(input: Stroke[], expected: Stroke[]): SequenceErrorType {
    const amountError = this.validateStrokeAmount(input.length, expected.length);
    if (amountError !== 'none') return amountError;

    const orderError = this.validateStrokeOrder(input, expected);
    if (orderError !== 'none') return orderError;

    return 'none';
  }

  // Real Validations

  private validateStrokeDirection(inputStroke: Stroke, expectedStroke: Stroke): StrokeErrorType {
    const strokeError: StrokeErrorType = 'none';
    return strokeError;
  }

  private validateStrokeShape(inputStroke: Stroke, expectedStroke: Stroke): StrokeErrorType {
    const strokeError: StrokeErrorType = 'none';
    return strokeError;
  }

  private validateStrokeAmount(inputAmount: number, expectedAmount: number): SequenceErrorType {
    if (inputAmount !== expectedAmount) return 'wrong-amount' as SequenceErrorType;
    return 'none' as SequenceErrorType;
  }

  private validateStrokeOrder(
    inputStrokes: Stroke[],
    expectedStrokes: Stroke[],
  ): SequenceErrorType {
    const sequenceError: SequenceErrorType = 'none';
    return sequenceError;
  }
}
