import { Component, ElementRef, input, ViewChild } from '@angular/core';
import { StrokeService } from '../../services/stroke.service';
import { Stroke } from '../../../../shared/models/writing/stroke.model';
import { Point } from '../../../../shared/models/writing/point.interface';
import { CanvasRenderService } from '../../services/canvas-render.service';
import { ActionBtn } from '../../../../shared/components/action-btn/action-btn';
import { StrokeValidationService } from '../../services/stroke-validation.service';
import {
  SequenceErrorType,
  SequenceValidationResult,
  StrokeValidationResult,
} from '../../models/stroke-validation-result.interface';
import { Table } from '../../../../shared/components/table/table';
import { TableConfig } from '../../../../shared/components/table/interface/table.interface';
import { JapaneseService } from '../../../../shared/services/japanese/japanese.service';
import { Kanji } from '../../../../shared/models/japanese/kanji.model';
import { Kana } from '../../../../shared/models/japanese/kana.model';

@Component({
  selector: 'app-writing-canvas',
  imports: [ActionBtn, Table],
  templateUrl: './writing-canvas.html',
  styleUrl: './writing-canvas.scss',
})
export class WritingCanvas {
  @ViewChild('writingCanvas') writingCanvas!: ElementRef<HTMLCanvasElement>;

  width = input.required<number>();
  height = input.required<number>();
  unicode = input.required<string>();
  type = input.required<string>();

  kanji!: Kanji;
  kana!: Kana;

  currentStroke: Stroke = new Stroke();
  lastPoint: Point = { x: -1, y: -1 };
  isPointerDown: boolean = false;

  expectedStrokes!: Stroke[];

  sequenceError: SequenceErrorType = 'none';
  isValidSequence: boolean = false;
  hasValidationResults = false;

  tableConfig: TableConfig<StrokeValidationResult> = {
    columns: [
      { key: 'strokeIndex', header: 'Stroke' },
      { key: 'isValid', header: 'Valid', formatter: (v) => (v ? 'Yes' : 'No') },
      { key: 'errorType', header: 'Error' },
    ],
    rows: [],
  };

  constructor(
    private strokeService: StrokeService,
    private canvasRenderService: CanvasRenderService,
    private strokeValidationService: StrokeValidationService,
    private japaneseService: JapaneseService,
  ) {}

  ngOnInit() {
    if (this.type() === 'kana')
      this.japaneseService.getKana(this.unicode()).subscribe({
        next: (kana) => {
          this.kana = kana;
          this.expectedStrokes = this.kana.strokes;
        },
        error: (err) => {
          console.error(err);
        },
      });
    else
      this.japaneseService.getKanji(this.unicode()).subscribe({
        next: (kanji) => {
          this.kanji = kanji;
          this.expectedStrokes = this.kanji.strokes;
        },
        error: (err) => {
          console.error(err);
        },
      });
  }

  ngAfterViewInit() {
    const canvasContext = this.writingCanvas.nativeElement.getContext('2d', {
      willReadFrequently: true,
    });
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
    this.isValidSequence = false;
    const inputStrokes = this.strokeService.getStrokes();
    const sequenceValidationResults = this.strokeValidationService.validateSequence(
      inputStrokes,
      this.expectedStrokes,
    );

    this.isValidSequence = sequenceValidationResults.isValidSequence;
    this.sequenceError = sequenceValidationResults.sequenceErrorType;
    this.tableConfig.rows = sequenceValidationResults.strokeResults;
    this.hasValidationResults = true;
  };

  resetCanvas = (): void => {
    this.strokeService.cleanStrokes();
    this.canvasRenderService.clearCanvas();
    this.lastPoint = { x: -1, y: -1 } as Point;
    this.isPointerDown = false;
    this.currentStroke = new Stroke();
    this.tableConfig.rows = [];
    this.sequenceError = 'none';
    this.isValidSequence = false;
    this.hasValidationResults = false;
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
