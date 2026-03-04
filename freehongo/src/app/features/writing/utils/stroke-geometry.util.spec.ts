import { Stroke } from '../models/stroke.model';
import { buildVectors, calculateAverageDistanceAB, vectorComparison } from './stroke-geometry.util';

describe('stroke-geometry utils', () => {
  it('buildVectors should create vectors from first to last points', () => {
    const input = new Stroke();
    input.setPoints([
      { x: 1, y: 1 },
      { x: 4, y: 5 },
    ]);
    const expected = new Stroke();
    expected.setPoints([
      { x: 2, y: 2 },
      { x: 5, y: 8 },
    ]);

    const { inputVector, expectedVector } = buildVectors(input, expected);

    expect(inputVector).toEqual([-3, -4]);
    expect(expectedVector).toEqual([-3, -6]);
  });

  it('vectorComparison should return true for same direction', () => {
    expect(vectorComparison([1, 0], [2, 0])).toBe(true);
  });

  it('vectorComparison should return false for opposite direction', () => {
    expect(vectorComparison([1, 0], [-1, 0])).toBe(false);
  });

  it('vectorComparison should handle zero vectors', () => {
    expect(vectorComparison([0, 0], [0, 0])).toBe(true);
    expect(vectorComparison([0, 0], [1, 0])).toBe(false);
  });

  it('calculateAverageDistanceAB should return 0 for identical arrays', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 3, y: 4 },
    ];

    const average = calculateAverageDistanceAB(points, points, points.length);

    expect(average).toBe(0);
  });

  it('calculateAverageDistanceAB should compute expected average', () => {
    const pointsA = [
      { x: 0, y: 0 },
      { x: 3, y: 4 },
    ];
    const pointsB = [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ];

    const average = calculateAverageDistanceAB(pointsA, pointsB, 2);

    expect(average).toBe(2.5);
  });
});
