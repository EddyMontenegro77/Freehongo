import { Injectable } from '@angular/core';
import { Stroke } from '../../../shared/models/writing/stroke.model';

@Injectable({
  providedIn: 'root',
})
export class StrokeService {
  private strokes: Stroke[] = [];
  private redoStack: Stroke[] = [];

  getStrokes(): Stroke[] {
    return this.strokes.map((stroke) => stroke.cloneStroke());
  }

  getRedoStack(): Stroke[] {
    return this.redoStack.map((stroke) => stroke.cloneStroke());
  }

  /**
   * Resets redoStack to avoid future cases.
   * @param stroke
   */
  addStroke(stroke: Stroke): void {
    this.strokes.push(stroke.cloneStroke());
    this.redoStack = [];
  }

  cleanStrokes(): void {
    this.strokes = [];
    this.redoStack = [];
  }

  /**
   *
   * @returns true if a stroke was pushed into the redoStack and false otherwise.
   */

  undo(): boolean {
    const removedStroke = this.strokes.pop();
    if (!removedStroke) return false;
    this.redoStack.push(removedStroke);
    return true;
  }

  /**
   *
   * @returns true if stroke was pushed back into strokes and false otherwise.
   */
  redo(): boolean {
    const removedStroke = this.redoStack.pop()?.cloneStroke();
    if (!removedStroke) return false;
    this.strokes.push(removedStroke);
    return true;
  }
}
