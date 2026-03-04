import { Injectable } from '@angular/core';
import { Stroke } from '../models/stroke.model';
import {
  SequenceErrorType,
  SequenceValidationResult,
  StrokeErrorType,
  StrokeValidationResult,
} from '../models/stroke-validation-result.interface';
import { Point } from '../models/point.interface';

@Injectable({
  providedIn: 'root',
})
export class StrokeValidationService {
  /**
   * Compares and validates a single input stroke with its expected one.
   * An stroke can be invalid if it mismatches expected direction or shape.
   *
   * @param inputStroke : Stroke
   * @param expectedStroke Stroke
   * @param strokeIndex : number Index to be used to compare input stroke with the expected one.
   * @returns StrokeValidationResult
   */
  validateStroke(
    inputStroke: Stroke,
    expectedStroke: Stroke,
    strokeIndex: number,
  ): StrokeValidationResult {
    const inputStrokeCopy = inputStroke.cloneStroke();
    const expectedStrokeCopy = expectedStroke.cloneStroke();

    inputStrokeCopy.setPoints(this.normalizePoints(inputStrokeCopy.getPoints()));
    expectedStrokeCopy.setPoints(this.normalizePoints(expectedStrokeCopy.getPoints()));

    const validationResult: StrokeErrorType = this.resolveStrokeError(
      inputStrokeCopy,
      expectedStrokeCopy,
    );
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

  /**
   * Compares and validates each one of user input strokes with the expected ones.
   * Sequence can be invalid if it does not matches expected order, amount
   * or if at least one of the strokes is invalid.
   *
   * @param inputStrokes Stroke array of user input strokes
   * @param expectedStrokes  Stroke array of expected strokes
   * @returns SequenceValidationResult
   */
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

  /**
   * Performs the validation for each stroke in the inputStrokes array.
   * Returns the results array and true if at least one stroke is invalid.
   *
   * @param inputStrokes Stroke array of user input strokes
   * @param expectedStrokes Stroke array of expected strokes
   * @returns StrokesResults : StrokeValidationResult[], hasInvalidStroke : boolean
   */

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

  // Normalization

  /**
   * Calls functions that normalize points in a stroke.
   *
   * @param points
   * @param targetCount : number | Number of samples for points array.
   * @param targetSize : number |
   * @returns Point[] normalized array of points.
   */

  private normalizePoints(points: Point[], targetCount = 32, targetSize = 100): Point[] {
    if (points.length === 0) return [];
    if (points.length === 1) return Array.from({ length: targetCount }, () => ({ ...points[0] }));

    const resampled = this.resamplePoints(points, targetCount);
    const translated = this.translateToOrigin(resampled); // origin = first point
    const scaled = this.scaleToBox(translated, targetSize);

    return scaled;
  }

  /**
   * Samples the Point[] to a fixed targetCount number of points
   * and returns a new array evenly spaced along the stroke path.
   * Calculates total distance for a Stroke, divides it in equal length segments
   * and performs linear interpolation.
   *
   * @param points : Point[]
   * @param targetCount : number | Standard point count in array.
   * @returns Point[] Point array with targetCount points evenly spaced.
   */

  private resamplePoints(points: Point[], targetCount: number): Point[] {
    // Build cumulative arc-length array
    const cumulative: number[] = [0];
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      // cumulative[i] = distance from start to points[i]
      cumulative.push(cumulative[i - 1] + Math.hypot(dx, dy));
    }

    const totalLength = cumulative[cumulative.length - 1];
    if (totalLength === 0) return Array.from({ length: targetCount }, () => ({ ...points[0] }));

    // Uniform spacing between resampled points (arc-length step)
    const step = totalLength / (targetCount - 1);

    // Add first point
    const result: Point[] = [{ ...points[0] }];

    let seg = 1;
    for (let i = 1; i < targetCount - 1; i++) {
      // New point distance from start
      const targetDist = i * step;

      // Search correct segment for new point
      while (seg < cumulative.length - 1 && cumulative[seg] < targetDist) seg++;

      const prevDist = cumulative[seg - 1];
      const nextDist = cumulative[seg];

      // Interpolation factor (% into the segment)
      const t = (targetDist - prevDist) / (nextDist - prevDist || 1);

      const p0 = points[seg - 1];
      const p1 = points[seg];

      // Linear interpolation
      result.push({
        x: p0.x + (p1.x - p0.x) * t,
        y: p0.y + (p1.y - p0.y) * t,
      });
    }

    // Add last point
    result.push({ ...points[points.length - 1] });
    return result;
  }

  /**
   * Fixes translational invariance by moving points to a fixed origin.
   * so the first point becomes (0,0).
   *
   * @param points: Point[]
   * @returns Point[] Points in it's fixed origin.
   */
  private translateToOrigin(points: Point[]): Point[] {
    const origin = points[0];
    // Removes translation by moving first point to (0,0)
    return points.map((p) => ({
      x: p.x - origin.x,
      y: p.y - origin.y,
    }));
  }

  /**
   * Fixes Size invariance by scaling points to a fixed scale.
   * determined by targetSize and aligning it back to origin.
   *
   * @param points
   * @param targetSize
   * @returns Point[]
   */
  private scaleToBox(points: Point[], targetSize: number): Point[] {
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }

    // Uniform scale factor so the largest dimension equals targetSize
    const width = maxX - minX;
    const height = maxY - minY;
    const scale = targetSize / Math.max(width, height, 1);

    /* Re-scale and aligns to origin again
     Normalize bounding box to [0, targetSize] while preserving aspect ratio */
    return points.map((p) => ({
      x: (p.x - minX) * scale,
      y: (p.y - minY) * scale,
    }));
  }

  private buildVectors(
    inputStroke: Stroke,
    expectedStroke: Stroke,
  ): { inputVector: Array<number>; expectedVector: Array<number> } {
    const inputPoints = inputStroke.getPoints();
    const firstInputPoint = inputPoints[0];
    const lastInputPoint = inputPoints[inputPoints.length - 1];

    const expectedPoints = expectedStroke.getPoints();
    const firstExpectedPoint = expectedPoints[0];
    const lastexpectedPoint = expectedPoints[expectedPoints.length - 1];

    const inputVector = [
      firstInputPoint.x - lastInputPoint.x,
      firstInputPoint.y - lastInputPoint.y,
    ];
    const expectedVector = [
      firstExpectedPoint.x - lastexpectedPoint.x,
      firstExpectedPoint.y - lastexpectedPoint.y,
    ];
    return { inputVector: inputVector, expectedVector: expectedVector };
  }

  /**
   * Compares two vectors by using cos(theta).
   * The closer cos(theta) is to one, the more similar both vectors will be.
   * Tolerance is the acceptance range of vector direction similarity.
   *
   * @param vectorA
   * @param vectorB
   * @param tolerance
   * @returns true if cost_theta >= tolerance
   */

  private vectorComparison(vectorA: number[], vectorB: number[], tolerance: number = 0.8): boolean {
    const magnitudeA = Math.hypot(vectorA[0], vectorA[1]);
    const magnitudeB = Math.hypot(vectorB[0], vectorB[1]);

    if (magnitudeA * magnitudeB === 0) return true;

    const dotProduct = vectorA[0] * vectorB[0] + vectorA[1] * vectorB[1];

    const cos_theta = dotProduct / (magnitudeA * magnitudeB);

    return cos_theta >= tolerance;
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

    const { inputVector, expectedVector } = this.buildVectors(inputStroke, expectedStroke);
    const isSimilar = this.vectorComparison(inputVector, expectedVector);
    if (!isSimilar) return 'wrong-direction';
    return 'none';
  }

  private validateStrokeShape(
    inputStroke: Stroke,
    expectedStroke: Stroke,
    shapeThreshold = 12,
  ): StrokeErrorType {
    const strokeError: StrokeErrorType = 'none';
    return strokeError;
  }

  private validateStrokeAmount(inputAmount: number, expectedAmount: number): SequenceErrorType {
    if (inputAmount !== expectedAmount) return 'wrong-amount';
    return 'none';
  }

  private validateStrokeOrder(
    inputStrokes: Stroke[],
    expectedStrokes: Stroke[],
  ): SequenceErrorType {
    const sequenceError: SequenceErrorType = 'none';
    return sequenceError;
  }
}
