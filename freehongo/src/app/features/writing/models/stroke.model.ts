import { Point } from './point.interface';

export class Stroke {
  points: Point[] = [];

  addPoint(point: Point) {
    this.points.push(point);
  }
}
