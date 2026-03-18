import { Point } from '../../../shared/models/writing/point.interface';

/**
 * Smooths a list of points using a simple weighted average.
 * The first and last points are preserved so the stroke keeps its endpoints.
 */
export function smoothPoints(points: Point[]): Point[] {
  if (points.length < 3) return points.map((point) => ({ x: point.x, y: point.y }));

  const smoothed: Point[] = [{ x: points[0].x, y: points[0].y }];

  for (let index = 1; index < points.length - 1; index++) {
    const previous = points[index - 1];
    const current = points[index];
    const next = points[index + 1];

    smoothed.push({
      x: previous.x * 0.25 + current.x * 0.5 + next.x * 0.25,
      y: previous.y * 0.25 + current.y * 0.5 + next.y * 0.25,
    });
  }

  const lastPoint = points[points.length - 1];
  smoothed.push({ x: lastPoint.x, y: lastPoint.y });

  return smoothed;
}

/**
 * Builds a smoothed segment for live drawing by appending the current point
 * and smoothing the resulting trail.
 */
export function getSmoothedSegment(previousPoints: Point[], currentPoint: Point): Point[] {
  return smoothPoints([...previousPoints, { x: currentPoint.x, y: currentPoint.y }]);
}
