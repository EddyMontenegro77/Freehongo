import { Stroke } from '../../../shared/models/writing/stroke.model';
import {
  normalizePoints,
  normalizeStrokes,
  scaleToBox,
  translateToOrigin,
} from './stroke-normalization.util';

describe('stroke-normalization utils', () => {
  it('normalizePoints should return target count for multi-point stroke', () => {
    const points = [
      { x: 10, y: 10 },
      { x: 20, y: 20 },
      { x: 40, y: 20 },
    ];

    const normalized = normalizePoints(points, 16, 100);

    expect(normalized).toHaveLength(16);
  });

  it('normalizePoints should handle empty points', () => {
    expect(normalizePoints([])).toEqual([]);
  });

  it('translateToOrigin should place first point at 0,0', () => {
    const translated = translateToOrigin([
      { x: 10, y: 5 },
      { x: 13, y: 9 },
    ]);

    expect(translated[0]).toEqual({ x: 0, y: 0 });
  });

  it('scaleToBox should fit the largest dimension to target size', () => {
    const scaled = scaleToBox(
      [
        { x: 0, y: 0 },
        { x: 50, y: 100 },
      ],
      200,
    );

    const xs = scaled.map((point) => point.x);
    const ys = scaled.map((point) => point.y);
    const width = Math.max(...xs) - Math.min(...xs);
    const height = Math.max(...ys) - Math.min(...ys);

    expect(Math.max(width, height)).toBeCloseTo(200, 5);
  });

  it('normalizeStrokes should clone and normalize all strokes', () => {
    const strokeA = new Stroke();
    strokeA.setPoints([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ]);
    const strokeB = new Stroke();
    strokeB.setPoints([
      { x: 0, y: 0 },
      { x: 0, y: 10 },
    ]);

    const normalized = normalizeStrokes([strokeA, strokeB]);

    const pointsA = normalized[0].getPoints();
    const xsA = pointsA.map((p) => p.x);
    const ysA = pointsA.map((p) => p.y);
    const widthA = Math.max(...xsA) - Math.min(...xsA);
    const heightA = Math.max(...ysA) - Math.min(...ysA);

    const pointsB = normalized[1].getPoints();
    const xsB = pointsB.map((p) => p.x);
    const ysB = pointsB.map((p) => p.y);
    const widthB = Math.max(...xsB) - Math.min(...xsB);
    const heightB = Math.max(...ysB) - Math.min(...ysB);

    // Should normalize
    expect(normalized).toHaveLength(2);

    expect(normalized[0]).not.toBe(strokeA);
    expect(normalized[1]).not.toBe(strokeB);

    // Resample
    expect(normalized[0].getPoints()).toHaveLength(32);
    expect(normalized[1].getPoints()).toHaveLength(32);

    // Translate to origin
    expect(normalized[0].getPoints()[0].x).toBe(0);
    expect(normalized[0].getPoints()[0].y).toBe(0);

    // Scale
    expect(Math.max(widthA, heightA)).toBeCloseTo(100, 5);
    expect(Math.max(widthB, heightB)).toBeCloseTo(100, 5);
  });
});
