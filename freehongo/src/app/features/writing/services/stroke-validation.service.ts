import { Injectable } from '@angular/core';
import { Stroke } from '../models/stroke.model';
import {
  SequenceErrorType,
  SequenceValidationResult,
  StrokeErrorType,
  StrokeValidationResult,
} from '../models/stroke-validation-result.interface';
import { normalizeStrokes } from '../utils/stroke-normalization.util';
import {
  buildVectors,
  calculateAverageDistanceAB,
  vectorComparison,
} from '../utils/stroke-geometry.util';
import { Point } from '../models/point.interface';

@Injectable({
  providedIn: 'root',
})
export class StrokeValidationService {
  /**
   * Normalizes and compares each one of user input strokes with the expected ones.
   * Sequence can be invalid if it does not matches expected order, amount
   * or if at least one of the strokes is invalid.
   *
   * @param inputStrokes Stroke array of user input strokes
   * @param expectedStrokes  Stroke array of expected strokes
   * @returns SequenceValidationResult
   */
  validateSequence(inputStrokes: Stroke[], expectedStrokes: Stroke[]): SequenceValidationResult {
    const normalizedInputStrokes = normalizeStrokes(inputStrokes);
    const normalizedExpectedStrokes = normalizeStrokes(expectedStrokes);

    const { strokesResults, hasInvalidStroke } = this.buildStrokeResults(
      normalizedInputStrokes,
      normalizedExpectedStrokes,
    );

    const sequenceValidationResult = this.resolveSequenceError(
      normalizedInputStrokes,
      normalizedExpectedStrokes,
    );

    const isValidSequence = sequenceValidationResult === 'none' && !hasInvalidStroke;

    const sequenceResults: SequenceValidationResult = {
      isValidSequence: isValidSequence,
      sequenceErrorType: sequenceValidationResult,
      strokeResults: strokesResults,
    };

    return sequenceResults;
  }

  /**
   * Compares and validates a single input stroke with its expected one.
   * An stroke can be invalid if it mismatches expected direction or shape.
   *
   * @param normalizedInputStroke : Stroke
   * @param normalizedExpectedStroke Stroke
   * @param strokeIndex : number Index to be used to compare input stroke with the expected one.
   * @returns StrokeValidationResult
   */
  private validateStroke(
    normalizedInputStroke: Stroke,
    normalizedExpectedStroke: Stroke,
    strokeIndex: number,
  ): StrokeValidationResult {
    const validationResult: StrokeErrorType = this.resolveStrokeError(
      normalizedInputStroke,
      normalizedExpectedStroke,
    );
    const isValid = validationResult === 'none';

    const strokeResult: StrokeValidationResult = {
      strokeIndex: strokeIndex,
      isValid: isValid,
      inputStroke: normalizedInputStroke,
      expectedStroke: normalizedExpectedStroke,
      errorType: validationResult,
    };
    return strokeResult;
  }

  /**
   * Performs the validation for each stroke in the inputStrokes array.
   * Returns the results array and true if at least one stroke is invalid.
   *
   * @param normalizedInputStrokes Stroke array of user input strokes
   * @param normalizedExpectedStrokes Stroke array of expected strokes
   * @returns StrokesResults : StrokeValidationResult[], hasInvalidStroke : boolean
   */

  private buildStrokeResults(
    normalizedInputStrokes: Stroke[],
    normalizedExpectedStrokes: Stroke[],
  ): { strokesResults: StrokeValidationResult[]; hasInvalidStroke: boolean } {
    const strokesResults = new Array<StrokeValidationResult>();
    let hasInvalidStroke = false;

    const iterationBoundary = Math.min(
      normalizedInputStrokes.length,
      normalizedExpectedStrokes.length,
    );

    for (let strokeIndex = 0; strokeIndex < iterationBoundary; strokeIndex++) {
      const validationResult = this.validateStroke(
        normalizedInputStrokes[strokeIndex],
        normalizedExpectedStrokes[strokeIndex],
        strokeIndex,
      );
      if (!validationResult.isValid) hasInvalidStroke = true;
      strokesResults.push(validationResult);
    }

    return { strokesResults, hasInvalidStroke };
  }

  /**
   * Helper that performs direction and shape validation for a Stroke.
   * It verifies in priority order, this being direction > shape
   * Returns the first error that occurred.
   *
   * @param input
   * @param expected
   * @returns StrokeErrorType
   */

  private resolveStrokeError(input: Stroke, expected: Stroke): StrokeErrorType {
    const directionError = this.validateStrokeDirection(input, expected);
    if (directionError !== 'none') return directionError;

    const shapeError = this.validateStrokeShape(input, expected);
    if (shapeError !== 'none') return shapeError;

    return 'none';
  }

  /**
   * Helper that performs amount and order validation for a sequence of Strokes.
   * It verifies in priority order, this being amount > order
   * Returns the first error that occurred.
   *
   * @param input
   * @param expected
   * @returns SequenceErrorType
   */

  private resolveSequenceError(input: Stroke[], expected: Stroke[]): SequenceErrorType {
    const amountError = this.validateStrokeAmount(input.length, expected.length);
    if (amountError !== 'none') return amountError;

    const orderError = this.validateStrokeOrder(input, expected);
    if (orderError !== 'none') return orderError;

    return 'none';
  }

  // Real Validations (assumes it's normalized for single strokes validation)

  /**
   * Compares stroke direction using vector similarity.
   * A stroke is considered valid if:
   * - Both strokes have at least 2 points
   * - The angle between their vectors is within the allowed threshold
   *
   * If a stroke has fewer than 2 points, direction validation is skipped.
   *
   * @param inputStroke
   * @param expectedStroke
   * @returns StrokeErrorType
   */

  private validateStrokeDirection(inputStroke: Stroke, expectedStroke: Stroke): StrokeErrorType {
    if (inputStroke.getPoints().length < 2 || expectedStroke.getPoints().length < 2) return 'none';

    const { inputVector, expectedVector } = buildVectors(inputStroke, expectedStroke);
    const isSimilar = vectorComparison(inputVector, expectedVector);
    if (!isSimilar) return 'wrong-direction';
    return 'none';
  }

  /**
   * Calculates average distance between points and compares the result
   * with the shapeThreshold to validate if it is a valid shape.
   *
   * @param inputStroke
   * @param expectedStroke
   * @param shapeThreshold
   * @returns StrokeErrorType | 'none' or 'wrong-shape'
   */

  private validateStrokeShape(
    inputStroke: Stroke,
    expectedStroke: Stroke,
    shapeThreshold = 12,
  ): StrokeErrorType {
    const inputPoints = inputStroke.getPoints();
    const expectedPoints = expectedStroke.getPoints();
    const minIndex = Math.min(inputPoints.length, expectedPoints.length);

    if (minIndex === 0) return 'none';

    const averageDistancesAB = calculateAverageDistanceAB(inputPoints, expectedPoints, minIndex);

    if (averageDistancesAB > shapeThreshold) return 'wrong-shape';
    return 'none';
  }

  private validateStrokeAmount(inputAmount: number, expectedAmount: number): SequenceErrorType {
    if (inputAmount !== expectedAmount) return 'wrong-amount';
    return 'none';
  }

  /**
   * Validates stroke order by matching each input stroke to the closest
   * non-used expected stroke (greedy by average shape distance).
   * After matching, order is valid only if matched expected indices
   * are strictly increasing.
   *
   * Returns:
   * - 'wrong-amount' if stroke counts differ
   * - 'wrong-order' if no valid match exists or matched order is not increasing
   * - 'none' otherwise
   *
   * @param inputStrokes
   * @param expectedStrokes
   * @returns SequenceErrorType
   */

  private validateStrokeOrder(
    inputStrokes: Stroke[],
    expectedStrokes: Stroke[],
  ): SequenceErrorType {
    if (inputStrokes.length !== expectedStrokes.length) return 'wrong-amount';
    if (inputStrokes.length === 0) return 'none';

    const matchedExpectedIndices: number[] = [];
    const usedExpected = new Set<number>();

    for (let inputIndex = 0; inputIndex < inputStrokes.length; inputIndex++) {
      const inputNormalized = inputStrokes[inputIndex];
      const inputNormalizedPoints = inputNormalized.getPoints();

      const bestMatchIndex = this.findBestExpectedMatch(
        inputNormalizedPoints,
        expectedStrokes,
        usedExpected,
      );

      if (bestMatchIndex === -1) return 'wrong-order';
      usedExpected.add(bestMatchIndex);
      matchedExpectedIndices.push(bestMatchIndex);
    }

    const isOrdered = matchedExpectedIndices.every(
      (value, i) => i === 0 || value > matchedExpectedIndices[i - 1],
    );

    return isOrdered ? 'none' : 'wrong-order';
  }

  private findBestExpectedMatch(
    inputPoints: Point[],
    expectedStrokes: Stroke[],
    usedExpected: Set<number>,
  ): number {
    let bestMatchIndex = -1;
    let bestMatchScore = Infinity;

    for (let expectedIndex = 0; expectedIndex < expectedStrokes.length; expectedIndex++) {
      if (usedExpected.has(expectedIndex)) continue;

      const expectedStroke = expectedStrokes[expectedIndex];
      const expectedPoints = expectedStroke.getPoints();

      const score = calculateAverageDistanceAB(
        inputPoints,
        expectedPoints,
        Math.min(inputPoints.length, expectedPoints.length),
      );

      // Less score means better approach to expected stroke
      if (score < bestMatchScore) {
        bestMatchScore = score;
        bestMatchIndex = expectedIndex;
      }
    }
    return bestMatchIndex;
  }
}
