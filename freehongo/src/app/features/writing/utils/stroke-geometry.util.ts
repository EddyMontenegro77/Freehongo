import { Point } from '../models/point.interface';
import { Stroke } from '../models/stroke.model';

/**
 * Takes first and last points of each stroke, differences x and y coordinates
 * to calculate the respective vector
 *
 * @param inputStroke
 * @param expectedStroke
 * @returns inputVector:number[], expectedVector:number[]
 */

export function buildVectors(
  inputStroke: Stroke,
  expectedStroke: Stroke,
): { inputVector: Array<number>; expectedVector: Array<number> } {
  const inputPoints = inputStroke.getPoints();
  const firstInputPoint = inputPoints[0];
  const lastInputPoint = inputPoints[inputPoints.length - 1];

  const expectedPoints = expectedStroke.getPoints();
  const firstExpectedPoint = expectedPoints[0];
  const lastExpectedPoint = expectedPoints[expectedPoints.length - 1];

  const inputVector = [firstInputPoint.x - lastInputPoint.x, firstInputPoint.y - lastInputPoint.y];
  const expectedVector = [
    firstExpectedPoint.x - lastExpectedPoint.x,
    firstExpectedPoint.y - lastExpectedPoint.y,
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

export function vectorComparison(
  vectorA: number[],
  vectorB: number[],
  tolerance: number = 0.8,
): boolean {
  const magnitudeA = Math.hypot(vectorA[0], vectorA[1]);
  const magnitudeB = Math.hypot(vectorB[0], vectorB[1]);

  if (magnitudeA === 0 && magnitudeB === 0) return true;
  if (magnitudeA === 0 || magnitudeB === 0) return false;

  const dotProduct = vectorA[0] * vectorB[0] + vectorA[1] * vectorB[1];

  const cos_theta = dotProduct / (magnitudeA * magnitudeB);

  return cos_theta >= tolerance;
}

/**
 * Sums accumulative distances for each set of points using hypot and then calculates average.
 * If the minIndex equals 0, then it will return 0 for avoiding division errors.
 *
 * @param pointsA
 * @param pointsB
 * @param minIndex:number
 * @returns averageDistancesAB:number
 */
export function calculateAverageDistanceAB(
  pointsA: Point[],
  pointsB: Point[],
  minIndex: number,
): number {
  let distanceSum = 0;
  if (minIndex === 0) return 0;

  for (let pointIndex = 0; pointIndex < minIndex; pointIndex++) {
    const currentAPoint = pointsA[pointIndex];
    const currentBPoint = pointsB[pointIndex];

    const dx = currentAPoint.x - currentBPoint.x;
    const dy = currentAPoint.y - currentBPoint.y;

    const distanceAB = Math.hypot(dx, dy);
    distanceSum += distanceAB;
  }

  const averageDistancesAB = distanceSum / minIndex;
  return averageDistancesAB;
}
