import { StrokeValidationService } from './stroke-validation.service';
import { Stroke } from '../../../shared/models/writing/stroke.model';

type Pair = [number, number];

/** Deterministic pseudo noise in [-amplitude, amplitude], so the tests never flake. */
const noise = (seed: number, amplitude: number): number => Math.sin(seed * 12.9898) * amplitude;

/**
 * Straight stroke from `from` to `to`. All strokes use the same number of points so
 * the comparison does not depend on how the distance function aligns different lengths.
 */
function line(from: Pair, to: Pair, options: { jitter?: number; seed?: number } = {}): Stroke {
  const { jitter = 0, seed = 1 } = options;
  const points = 20;
  const stroke = new Stroke();

  for (let i = 0; i < points; i++) {
    const t = i / (points - 1);
    stroke.addPoint({
      x: from[0] + (to[0] - from[0]) * t + noise(seed + i, jitter),
      y: from[1] + (to[1] - from[1]) * t + noise(seed + i + 100, jitter),
    });
  }

  return stroke;
}

// Order is checked on strokes normalized together in a shared 100-unit box, so
// position and relative size matter, but where or how big the whole character is does not.
describe('StrokeValidationService - stroke order', () => {
  const service = new StrokeValidationService();

  // 三: three parallel horizontal lines, the typical case of similar strokes.
  const expectedThree = (): Stroke[] => [
    line([0, 0], [100, 0]),
    line([0, 50], [100, 50]),
    line([0, 100], [100, 100]),
  ];

  // 十: a horizontal and a vertical stroke.
  const expectedCross = (): Stroke[] => [line([0, 50], [100, 50]), line([50, 0], [50, 100])];

  it('accepts the exact expected order', () => {
    const result = service.validateSequence(expectedThree(), expectedThree());

    expect(result.sequenceErrorType).toBe('none');
    expect(result.isValidSequence).toBe(true);
  });

  it('accepts similar parallel strokes drawn in order with small imprecision', () => {
    const drawn = [
      line([0, 0], [100, 0], { jitter: 3, seed: 1 }),
      line([0, 50], [100, 50], { jitter: 3, seed: 2 }),
      line([0, 100], [100, 100], { jitter: 3, seed: 3 }),
    ];

    const result = service.validateSequence(drawn, expectedThree());

    expect(result.sequenceErrorType).toBe('none');
    expect(result.isValidSequence).toBe(true);
  });

  it('accepts a correct character drawn smaller and in another place', () => {
    // Same three lines at half size, moved far from the origin.
    const drawn = [
      line([300, 200], [350, 200]),
      line([300, 225], [350, 225]),
      line([300, 250], [350, 250]),
    ];

    const result = service.validateSequence(drawn, expectedThree());

    expect(result.sequenceErrorType).toBe('none');
    expect(result.isValidSequence).toBe(true);
  });

  it('detects swapped strokes', () => {
    const drawn = [line([50, 0], [50, 100]), line([0, 50], [100, 50])];

    const result = service.validateSequence(drawn, expectedCross());

    expect(result.sequenceErrorType).toBe('wrong-order');
    expect(result.isValidSequence).toBe(false);
  });

  it('detects swapped parallel strokes', () => {
    const drawn = [line([0, 50], [100, 50]), line([0, 0], [100, 0]), line([0, 100], [100, 100])];

    const result = service.validateSequence(drawn, expectedThree());

    expect(result.sequenceErrorType).toBe('wrong-order');
  });

  it('does not report a sloppy stroke as wrong order', () => {
    // Right order, but the first stroke is a diagonal instead of the top line.
    // A greedy match used to pair it with the middle line and flag the order.
    const drawn = [line([0, 0], [100, 100]), line([0, 50], [100, 50]), line([0, 100], [100, 100])];

    const result = service.validateSequence(drawn, expectedThree());

    expect(result.sequenceErrorType).toBe('none');
    expect(result.isValidSequence).toBe(false);
    expect(result.strokeResults[0].isValid).toBe(false);
  });

  it('reports wrong amount when a stroke is missing', () => {
    const drawn = [line([0, 0], [100, 0]), line([0, 50], [100, 50])];

    const result = service.validateSequence(drawn, expectedThree());

    expect(result.sequenceErrorType).toBe('wrong-amount');
    expect(result.isValidSequence).toBe(false);
  });
});
