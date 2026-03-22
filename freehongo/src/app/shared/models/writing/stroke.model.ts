import { Point } from './point.interface';

export class Stroke {
  private points: Point[] = [];

  addPoint(point: Point): void {
    this.points.push(point);
  }

  setPoint(index: number, value: Point): void {
    this.points[index] = value;
  }

  setPoints(points: Point[]): void {
    this.points = points;
  }

  getPoints(): Point[] {
    return this.points.map((p) => ({ x: p.x, y: p.y }));
  }

  cloneStroke(): Stroke {
    const copy = new Stroke();
    copy.points = this.points.map((p) => ({ x: p.x, y: p.y }));
    return copy;
  }

  static fromStrokeData(points: Point[]): Stroke {
    const stroke = new Stroke();
    stroke.setPoints(points);
    return stroke;
  }
}
