import { Injectable } from '@angular/core';
import { Point } from '../models/point.interface';

@Injectable({
  providedIn: 'root',
})
export class CanvasRenderService {
  canvasContext!: CanvasRenderingContext2D;

  setCanvasContext(canvasContext: CanvasRenderingContext2D): void {
    this.canvasContext = canvasContext;
    canvasContext.fillStyle = 'black';
  }

  renderPoint(lastPoint: Point, currentPoint: Point): void {
    this.canvasContext.beginPath();
    this.canvasContext.moveTo(lastPoint.x, lastPoint.y);
    this.canvasContext.lineTo(currentPoint.x, currentPoint.y);
    this.canvasContext.stroke();
  }
}
