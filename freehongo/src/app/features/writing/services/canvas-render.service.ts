import { Injectable } from '@angular/core';
import { Point } from '../models/point.interface';
import { Stroke } from '../models/stroke.model';

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
    this.canvasContext.beginPath();
    this.canvasContext.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      this.canvasContext.lineTo(points[i].x, points[i].y);
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
}
