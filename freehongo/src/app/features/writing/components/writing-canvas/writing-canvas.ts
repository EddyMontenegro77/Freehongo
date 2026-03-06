import { Component, ElementRef, input, ViewChild } from '@angular/core';
import { StrokeService } from '../../services/stroke.service';
import { Stroke } from '../../models/stroke.model';
import { Point } from '../../models/point.interface';
import { CanvasRenderService } from '../../services/canvas-render.service';
import { ActionBtn } from '../../../../shared/components/action-btn/action-btn';
import { StrokeValidationService } from '../../services/stroke-validation.service';
import { SequenceValidationResult } from '../../models/stroke-validation-result.interface';

@Component({
  selector: 'app-writing-canvas',
  imports: [ActionBtn],
  templateUrl: './writing-canvas.html',
  styleUrl: './writing-canvas.scss',
})
export class WritingCanvas {
  @ViewChild('writingCanvas') writingCanvas!: ElementRef<HTMLCanvasElement>;

  width = input.required<number>();
  height = input.required<number>();
  currentStroke: Stroke = new Stroke();
  lastPoint: Point = { x: -1, y: -1 };
  isPointerDown: boolean = false;

  expectedStrokes = input.required<Stroke[]>();
  sequenceValidationResults!: SequenceValidationResult;

  constructor(
    private strokeService: StrokeService,
    private canvasRenderService: CanvasRenderService,
    private strokeValidationService: StrokeValidationService,
  ) {}

  ngAfterViewInit() {
    const canvasContext = this.writingCanvas.nativeElement.getContext('2d');
    if (!canvasContext) throw new Error('Canvas 2D context cannot be obtained');
    this.canvasRenderService.setCanvasContext(canvasContext);
  }

  onPointerDown(event: PointerEvent): void {
    this.isPointerDown = true;
    this.currentStroke = new Stroke();
    const currentPoint = this.getCanvasCoordinates(event);
    this.lastPoint = currentPoint;
    this.currentStroke.addPoint(currentPoint);
  }

  onPointerUp(event: PointerEvent): void {
    if (!this.isPointerDown) return;
    this.isPointerDown = false;
    const currentPoint = this.getCanvasCoordinates(event);
    this.currentStroke.addPoint(currentPoint);
    this.strokeService.addStroke(this.currentStroke);
    this.canvasRenderService.renderPoint(this.lastPoint, currentPoint);
    this.lastPoint = currentPoint;
    this.canvasRenderService.saveCanvasSnapshot();
  }

  onPointerMove(event: PointerEvent) {
    if (!this.isPointerDown) return;
    const currentPoint = this.getCanvasCoordinates(event);

    if (currentPoint.x === this.lastPoint.x && currentPoint.y === this.lastPoint.y) return;

    this.currentStroke.addPoint(currentPoint);
    this.canvasRenderService.renderPoint(this.lastPoint, currentPoint);
    this.lastPoint = currentPoint;
  }

  // Actions

  getSequenceValidationResults = (): void => {
    const inputStrokes = this.strokeService.getStrokes();
    this.sequenceValidationResults = this.strokeValidationService.validateSequence(
      inputStrokes,
      this.expectedStrokes(),
    );
    // To Do: make validation reflex in component view.
  };

  resetCanvas = (): void => {
    this.strokeService.cleanStrokes();
    this.canvasRenderService.clearCanvas();
    this.lastPoint = { x: -1, y: -1 } as Point;
    this.isPointerDown = false;
    this.currentStroke = new Stroke();
  };

  undoStroke = (): void => {
    if (!this.strokeService.undo()) return;
    // Snapshot history is capped; when canvas history cannot move further back,
    // rebuild from StrokeService (source of truth) to keep data and UI in sync.
    if (!this.canvasRenderService.undoCanvasSnapshot()) {
      this.canvasRenderService.renderAllStrokes(this.strokeService.getStrokes());
    }
  };

  redoStroke = (): void => {
    if (!this.strokeService.redo()) return;
    // Same fallback logic as undo: if snapshot redo is unavailable,
    // redraw from the current stroke state.
    if (!this.canvasRenderService.redoCanvasSnapshot()) {
      this.canvasRenderService.renderAllStrokes(this.strokeService.getStrokes());
    }
  };

  private getCanvasCoordinates(event: PointerEvent): Point {
    const canvas = this.writingCanvas.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }
}
