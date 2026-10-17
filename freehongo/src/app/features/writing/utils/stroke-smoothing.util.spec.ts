import { normalizeStrokes, normalizeStrokeSet } from './stroke-normalization.util';
import { Stroke } from '../../../shared/models/writing/stroke.model';

type Pair = [number, number];

function line(from: Pair, to: Pair, points = 10): Stroke {
  const stroke = new Stroke();

  for (let i = 0; i < points; i++) {
    const t = i / (points - 1);
    stroke.addPoint({
      x: from[0] + (to[0] - from[0]) * t,
      y: from[1] + (to[1] - from[1]) * t,
    });
  }

  return stroke;
}

describe('normalizeStrokeSet', () => {
  // Two parallel horizontal lines, the second one 100 units below the first.
  const parallelLines = (): Stroke[] => [line([0, 0], [100, 0]), line([0, 100], [100, 100])];

  it('returns an empty list when there are no strokes', () => {
    expect(normalizeStrokeSet([])).toEqual([]);
  });

  it('resamples every stroke to the same number of points', () => {
    const normalized = normalizeStrokeSet(parallelLines(), 32);

    expect(normalized.map((stroke) => stroke.getPoints().length)).toEqual([32, 32]);
  });

  it('keeps the relative position of the strokes', () => {
    const [top, bottom] = normalizeStrokeSet(parallelLines());

    expect(top.getPoints()[0].y).toBeCloseTo(0, 5);
    expect(bottom.getPoints()[0].y).toBeCloseTo(100, 5);
  });

  it('fits the whole character in one box of the target size', () => {
    const points = normalizeStrokeSet(
      [line([300, 200], [350, 200]), line([300, 250], [350, 250])],
      32,
      100,
    ).flatMap((stroke) => stroke.getPoints());

    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);

    expect(Math.min(...xs, ...ys)).toBeCloseTo(0, 5);
    expect(Math.max(...xs, ...ys)).toBeCloseTo(100, 5);
  });

  it('gives the same result wherever and however big the character was drawn', () => {
    const small = normalizeStrokeSet([line([300, 200], [350, 200]), line([300, 250], [350, 250])]);
    const big = normalizeStrokeSet(parallelLines());

    small.forEach((stroke, strokeIndex) => {
      stroke.getPoints().forEach((point, pointIndex) => {
        const expected = big[strokeIndex].getPoints()[pointIndex];

        expect(point.x).toBeCloseTo(expected.x, 5);
        expect(point.y).toBeCloseTo(expected.y, 5);
      });
    });
  });

  it('does not modify the original strokes', () => {
    const strokes = parallelLines();

    normalizeStrokeSet(strokes);

    expect(strokes[1].getPoints()[0]).toEqual({ x: 0, y: 100 });
    expect(strokes[1].getPoints()).toHaveLength(10);
  });
});

describe('normalizeStrokes (per stroke)', () => {
  it('makes parallel strokes identical, which is why it cannot be used to compare order', () => {
    const [top, bottom] = normalizeStrokes([line([0, 0], [100, 0]), line([0, 100], [100, 100])]);

    top.getPoints().forEach((point, index) => {
      const other = bottom.getPoints()[index];

      expect(point.x).toBeCloseTo(other.x, 5);
      expect(point.y).toBeCloseTo(other.y, 5);
    });
  });
});
