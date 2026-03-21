import { ElementRef, Injectable } from '@angular/core';
import { Point } from '../../../shared/models/writing/point.interface';
import { Stroke } from '../../../shared/models/writing/stroke.model';
import { smoothPoints } from '../utils/stroke-smoothing.util';

@Injectable({
  providedIn: 'root',
})
export class CanvasRenderService {
  canvasContext!: CanvasRenderingContext2D;
  // Keep only recent canvas states to bound memory usage.
  historyImages: ImageData[] = [];
  historyIndex: number = 0;

  setCanvasContext(canvasContext: CanvasRenderingContext2D, fillStyle: string = 'black'): void {
    this.canvasContext = canvasContext;
    canvasContext.fillStyle = fillStyle;
    canvasContext.lineWidth = 4;
    canvasContext.lineCap = 'round';
    canvasContext.lineJoin = 'round';
    this.saveCanvasSnapshot();
  }

  renderPoint(lastPoint: Point, currentPoint: Point): void {
    this.canvasContext.beginPath();
    this.canvasContext.moveTo(lastPoint.x, lastPoint.y);
    this.canvasContext.lineTo(currentPoint.x, currentPoint.y);
    this.canvasContext.stroke();
  }

  renderStroke(stroke: Stroke): void {
    const points = stroke.getPoints();
    if (points.length < 1) return;

    const smootedPoints = smoothPoints(points);

    this.canvasContext.beginPath();
    this.canvasContext.moveTo(smootedPoints[0].x, smootedPoints[0].y);
    for (let i = 1; i < smootedPoints.length; i++) {
      this.canvasContext.lineTo(smootedPoints[i].x, smootedPoints[i].y);
    }
    this.canvasContext.stroke();
  }

  renderAllStrokes(strokes: Stroke[]): void {
    this.clearCanvas();
    for (const stroke of strokes) this.renderStroke(stroke);
    this.saveCanvasSnapshot();
  }

  /**
   * Captures the state of the canvas and saves the imageData
   */

  saveCanvasSnapshot(MAX_SNAPSHOTS = 80): void {
    // Removes future states after undo and redraw
    if (this.historyIndex < this.historyImages.length - 1) {
      this.historyImages = this.historyImages.slice(0, this.historyIndex + 1);
    }

    const { width, height } = this.canvasContext.canvas;
    const imageData = this.canvasContext.getImageData(0, 0, width, height);
    // Snapshot history is capped. Older visual states are dropped first.
    // Data-level undo/redo is handled in StrokeService, and callers may redraw
    // from strokes when a snapshot transition is unavailable.
    if (this.historyImages.length < MAX_SNAPSHOTS) {
      this.historyImages.push(imageData);
      this.historyIndex = this.historyImages.length - 1;
    } else {
      this.historyImages.shift();
      this.historyImages.push(imageData);
      this.historyIndex = this.historyImages.length - 1;
    }
  }

  /**
   *
   * @returns true if undo was successfully performed
   */
  undoCanvasSnapshot(): boolean {
    if (this.historyIndex <= 0) return false;
    this.historyIndex--;
    const imageData = this.historyImages[this.historyIndex];
    if (!imageData) return false;
    this.canvasContext.putImageData(imageData, 0, 0);
    return true;
  }

  /**
   *
   * @returns true if redo was successfully performed
   */

  redoCanvasSnapshot(): boolean {
    if (this.historyIndex >= this.historyImages.length - 1) return false;
    this.historyIndex++;
    const imageData = this.historyImages[this.historyIndex];
    if (!imageData) return false;
    this.canvasContext.putImageData(imageData, 0, 0);
    return true;
  }

  clearCanvas(): void {
    const { width, height } = this.canvasContext.canvas;
    this.canvasContext.clearRect(0, 0, width, height);
    this.historyImages = [];
    this.historyIndex = 0;
    this.saveCanvasSnapshot();
  }

  static getCanvasCoordinates(canvas: HTMLCanvasElement, event: PointerEvent): Point {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }
}
