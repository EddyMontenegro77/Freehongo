import { Component, ElementRef, input, ViewChild } from '@angular/core';
import { StrokeService } from '../../services/stroke.service';
import { Stroke } from '../../models/stroke.model';
import { Point } from '../../models/point.interface';
import { CanvasRenderService } from '../../services/canvas-render.service';

@Component({
  selector: 'app-writing-canvas',
  imports: [],
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

  constructor(
    private strokeService: StrokeService,
    private canvasRenderService: CanvasRenderService,
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
    this.isPointerDown = false;
    const currentPoint = this.getCanvasCoordinates(event);
    this.currentStroke.addPoint(currentPoint);
    this.strokeService.addStroke(this.currentStroke);
    this.canvasRenderService.renderPoint(this.lastPoint, currentPoint);
    this.lastPoint = currentPoint;
  }

  onPointerMove(event: PointerEvent) {
    if (!this.isPointerDown) return;
    const currentPoint = this.getCanvasCoordinates(event);

    if (currentPoint.x === this.lastPoint.x && currentPoint.y === this.lastPoint.y) return;

    this.currentStroke.addPoint(currentPoint);
    this.canvasRenderService.renderPoint(this.lastPoint, currentPoint);
    this.lastPoint = currentPoint;
  }

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
