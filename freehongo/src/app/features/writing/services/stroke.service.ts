import { Injectable } from '@angular/core';
import { Stroke } from '../models/stroke.model';

@Injectable({
  providedIn: 'root',
})
export class StrokeService {
  strokes: Stroke[] = [];

  getStrokes(): Stroke[] {
    return this.strokes;
  }

  addStroke(stroke: Stroke): void {
    this.strokes.push(stroke);
  }

  cleanStrokes(): void {
    this.strokes = [];
  }

  removeStroke(index: number): Stroke | null {
    return this.strokes.splice(index, 1)[0] ?? null;
  }
}
