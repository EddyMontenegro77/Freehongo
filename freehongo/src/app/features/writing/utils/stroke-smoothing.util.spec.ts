import { getSmoothedSegment, smoothPoints } from './stroke-smoothing.util';

describe('stroke-smoothing util', () => {
  it('smoothPoints should preserve endpoints and smooth middle points', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
      { x: 20, y: 0 },
    ];

    const smoothed = smoothPoints(points);

    expect(smoothed).toEqual([
      { x: 0, y: 0 },
      { x: 10, y: 5 },
      { x: 20, y: 0 },
    ]);
  });

  it('smoothPoints should clone short point arrays', () => {
    const points = [
      { x: 1, y: 2 },
      { x: 3, y: 4 },
    ];

    const smoothed = smoothPoints(points);

    expect(smoothed).toEqual(points);
    expect(smoothed).not.toBe(points);
  });

  it('getSmoothedSegment should append the current point and smooth the trail', () => {
    const previousPoints = [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
    ];
    const currentPoint = { x: 20, y: 0 };

    const segment = getSmoothedSegment(previousPoints, currentPoint);

    expect(segment).toEqual([
      { x: 0, y: 0 },
      { x: 10, y: 5 },
      { x: 20, y: 0 },
    ]);
  });
});
