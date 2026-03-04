import { Point } from '../models/point.interface';
import { Stroke } from '../models/stroke.model';

/**
 * @param strokes:Stroke[]
 * @returns normalizedStrokes:Stroke[]
 */

export function normalizeStrokes(strokes: Stroke[]): Stroke[] {
  const normalizedStrokes = new Array<Stroke>();
  for (let strokeIndex = 0; strokeIndex < strokes.length; strokeIndex++) {
    const strokeCopy = strokes[strokeIndex].cloneStroke();
    strokeCopy.setPoints(normalizePoints(strokeCopy.getPoints()));
    normalizedStrokes.push(strokeCopy);
  }
  return normalizedStrokes;
}

/**
 * Resamples to targetCount, translates to origin (0,0) and scales to targetSize.
 * the given points.
 *
 * @param points
 * @param targetCount
 * @param targetSize
 * @returns
 */

export function normalizePoints(points: Point[], targetCount = 32, targetSize = 100): Point[] {
  if (points.length === 0) return [];
  if (points.length === 1) return Array.from({ length: targetCount }, () => ({ ...points[0] }));

  const resampled = resamplePoints(points, targetCount);
  const translated = translateToOrigin(resampled); // origin = first point
  const scaled = scaleToBox(translated, targetSize);

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

export function resamplePoints(points: Point[], targetCount: number): Point[] {
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
export function translateToOrigin(points: Point[]): Point[] {
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
export function scaleToBox(points: Point[], targetSize: number): Point[] {
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
