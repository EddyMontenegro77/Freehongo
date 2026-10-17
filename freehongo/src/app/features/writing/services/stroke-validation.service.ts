import { Injectable } from '@angular/core';
import { Stroke } from '../../../shared/models/writing/stroke.model';
import {
  SequenceErrorType,
  SequenceValidationResult,
  StrokeErrorType,
  StrokeValidationResult,
} from '../models/stroke-validation-result.interface';
import { normalizeStrokes, normalizeStrokeSet } from '../utils/stroke-normalization.util';
import {
  buildVectors,
  calculateAverageDistanceAB,
  vectorComparison,
} from '../utils/stroke-geometry.util';

/**
 * Maximum average distance for an input stroke to count as "the same shape" as an
 * expected one. Strokes are normalized one by one, so position and size do not count.
 */
const SHAPE_THRESHOLD = 12;

/**
 * Maximum average distance for an input stroke to count as "the same stroke" as an
 * expected one when checking order. Strokes are normalized together in a shared
 * 0-100 box, so the distance includes position and is looser than the shape one.
 * Starting value: tune it by logging the distance matrix.
 */
const ORDER_THRESHOLD = 20;

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

    // Order needs positions, which per-stroke normalization throws away (every
    // parallel line would look identical), so it is checked on strokes normalized
    // together in one shared box.
    const sequenceValidationResult = this.resolveSequenceError(
      normalizeStrokeSet(inputStrokes),
      normalizeStrokeSet(expectedStrokes),
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
    shapeThreshold = SHAPE_THRESHOLD,
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
   * Validates stroke order. Expects strokes normalized together (normalizeStrokeSet),
   * so the distance between two strokes includes where they are in the character.
   *
   * 1. If every input stroke already fits the expected stroke of its own position,
   *    the order is right. Ties between similar strokes (parallel lines, repeated
   *    shapes) are therefore always resolved in favour of the expected order.
   * 2. Otherwise the order is wrong only when the strokes do fit the expected ones
   *    in a different order (a perfect matching under the threshold exists).
   * 3. If they do not fit in any order, the problem is in the strokes themselves
   *    (shape or direction). That is reported per stroke, not as 'wrong-order'.
   *
   * Returns:
   * - 'wrong-amount' if stroke counts differ
   * - 'wrong-order' if the strokes are right but drawn in another order
   * - 'none' otherwise
   *
   * @param inputStrokes
   * @param expectedStrokes
   * @param matchThreshold
   * @returns SequenceErrorType
   */

  private validateStrokeOrder(
    inputStrokes: Stroke[],
    expectedStrokes: Stroke[],
    matchThreshold = ORDER_THRESHOLD,
  ): SequenceErrorType {
    if (inputStrokes.length !== expectedStrokes.length) return 'wrong-amount';
    if (inputStrokes.length === 0) return 'none';

    const distances = this.buildDistanceMatrix(inputStrokes, expectedStrokes);

    const fitsOwnPosition = distances.every((row, index) => row[index] <= matchThreshold);
    if (fitsOwnPosition) return 'none';

    return this.hasPerfectMatch(distances, matchThreshold) ? 'wrong-order' : 'none';
  }

  /**
   * distances[i][j] is the average distance between input stroke i and expected stroke j.
   */
  private buildDistanceMatrix(inputStrokes: Stroke[], expectedStrokes: Stroke[]): number[][] {
    return inputStrokes.map((inputStroke) => {
      const inputPoints = inputStroke.getPoints();

      return expectedStrokes.map((expectedStroke) => {
        const expectedPoints = expectedStroke.getPoints();
        const length = Math.min(inputPoints.length, expectedPoints.length);

        if (length === 0) return Infinity;

        return calculateAverageDistanceAB(inputPoints, expectedPoints, length);
      });
    });
  }

  /**
   * True when every input stroke can be paired with a different expected stroke
   * whose distance is within the threshold (bipartite matching with augmenting paths).
   * Unlike a greedy match, an early stroke cannot "steal" the expected stroke
   * that a later one needs.
   */
  private hasPerfectMatch(distances: number[][], threshold: number): boolean {
    const size = distances.length;
    const inputOfExpected: number[] = new Array(size).fill(-1);

    const tryAssign = (input: number, visited: boolean[]): boolean => {
      for (let expected = 0; expected < size; expected++) {
        if (distances[input][expected] > threshold || visited[expected]) continue;

        visited[expected] = true;

        if (inputOfExpected[expected] === -1 || tryAssign(inputOfExpected[expected], visited)) {
          inputOfExpected[expected] = input;
          return true;
        }
      }

      return false;
    };

    for (let input = 0; input < size; input++) {
      if (!tryAssign(input, new Array<boolean>(size).fill(false))) return false;
    }

    return true;
  }
}
