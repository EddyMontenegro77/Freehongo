import {
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  output,
  signal,
  ViewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { StrokeService } from '../../services/stroke.service';
import { Stroke } from '../../../../shared/models/writing/stroke.model';
import { Point } from '../../../../shared/models/writing/point.interface';
import { CanvasRenderService } from '../../services/canvas-render.service';
import { ActionBtn } from '../../../../shared/components/action-btn/action-btn';
import { StrokeValidationService } from '../../services/stroke-validation.service';
import { StrokeValidationResult } from '../../models/stroke-validation-result.interface';
import { sequenceErrorLabel } from '../../mappers/sequence-error-label.mapper';
import { CharacterType } from '../../../../shared/models/japanese/character.type';
import { WritingValidation } from '../writing-validation/writing-validation';
import { WritingStrokeGuide } from '../writing-stroke-guide/writing-stroke-guide';
import {
  DEFAULT_WRITING_UI,
  WritingUiOptions,
  WritingValidationEvent,
} from '../../../../shared/models/quizes/quizes.interface';
import { IconBtn } from '../../../../shared/components/icon-btn/icon-btn';

@Component({
  selector: 'app-writing-canvas',
  standalone: true,
  imports: [ActionBtn, WritingValidation, WritingStrokeGuide, IconBtn],
  templateUrl: './writing-canvas.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './writing-canvas.scss',
})
export class WritingCanvas {
  @ViewChild('writingCanvas') writingCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild(WritingStrokeGuide) private strokeGuide?: WritingStrokeGuide;

  width = input.required<number>();
  height = input.required<number>();
  unicode = input.required<string>();
  type = input.required<CharacterType>();
  expectedStrokes = input.required<Stroke[]>();
  expectedUrl = input.required<string>();

  readonly validationCompleted = output<WritingValidationEvent>();

  readonly showPreview = signal(false);

  currentStroke: Stroke = new Stroke();
  lastPoint: Point = { x: -1, y: -1 };
  isPointerDown: boolean = false;

  sequenceError: string = 'none';
  isValidSequence: boolean = false;
  hasValidationResults = false;
  strokeResults: StrokeValidationResult[] = [];

  readonly ui = input<WritingUiOptions>(DEFAULT_WRITING_UI);

  private strokeService = inject(StrokeService);
  private canvasRenderService = inject(CanvasRenderService);
  private strokeValidationService = inject(StrokeValidationService);

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
    const currentPoint = CanvasRenderService.getCanvasCoordinates(
      this.writingCanvas.nativeElement,
      event,
    );
    this.lastPoint = currentPoint;
    this.currentStroke.addPoint(currentPoint);
  }

  onPointerUp(event: PointerEvent): void {
    if (!this.isPointerDown) return;
    this.isPointerDown = false;
    const currentPoint = CanvasRenderService.getCanvasCoordinates(
      this.writingCanvas.nativeElement,
      event,
    );
    this.currentStroke.addPoint(currentPoint);
    this.strokeService.addStroke(this.currentStroke);
    this.canvasRenderService.renderPoint(this.lastPoint, currentPoint);
    this.lastPoint = currentPoint;
    this.canvasRenderService.saveCanvasSnapshot();
  }

  onPointerMove(event: PointerEvent) {
    if (!this.isPointerDown) return;
    const currentPoint = CanvasRenderService.getCanvasCoordinates(
      this.writingCanvas.nativeElement,
      event,
    );

    if (currentPoint.x === this.lastPoint.x && currentPoint.y === this.lastPoint.y) return;

    this.currentStroke.addPoint(currentPoint);
    this.canvasRenderService.renderPoint(this.lastPoint, currentPoint);
    this.lastPoint = currentPoint;
  }

  // Event listeners
  @HostListener('window:keydown', ['$event'])
  handleKeyboard(event: KeyboardEvent): void {
    const ctrlOrMeta = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();
    const isUndo = ctrlOrMeta && !event.shiftKey && key === 'z';
    const isRedo = ctrlOrMeta && ((event.shiftKey && key === 'z') || key === 'y');
    const isReset = ctrlOrMeta && key === 'r';
    const isValidate = ctrlOrMeta && key === 'v';

    if (isUndo) {
      event.stopPropagation();
      event.preventDefault();
      this.undoStroke();
      return;
    }

    if (isRedo) {
      event.preventDefault();
      event.stopPropagation();
      this.redoStroke();
      return;
    }

    if (isReset) {
      event.preventDefault();
      event.stopPropagation();
      this.resetCanvas();
      return;
    }

    if (isValidate) {
      event.preventDefault();
      event.stopPropagation();
      this.getSequenceValidationResults();
      return;
    }
  }

  // Actions

  getSequenceValidationResults = (): void => {
    this.isValidSequence = false;
    const inputStrokes = this.strokeService.getStrokes();
    const sequenceValidationResults = this.strokeValidationService.validateSequence(
      inputStrokes,
      this.expectedStrokes(),
    );

    this.isValidSequence = sequenceValidationResults.isValidSequence;
    this.sequenceError = sequenceErrorLabel(sequenceValidationResults.sequenceErrorType);
    this.strokeResults = sequenceValidationResults.strokeResults;
    this.hasValidationResults = true;

    this.validationCompleted.emit({
      unicode: this.unicode(),
      isValid: this.isValidSequence,
      sequenceError: this.sequenceError,
      strokeResults: this.strokeResults,
    });
  };

  resetCanvas = (): void => {
    this.strokeService.cleanStrokes();
    this.canvasRenderService.clearCanvas();
    this.lastPoint = { x: -1, y: -1 } as Point;
    this.isPointerDown = false;
    this.currentStroke = new Stroke();
    this.strokeResults = [];
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

  togglePreview = (): void => {
    this.showPreview.update((visible) => !visible);
  };

  /** Restarts the stroke-order animation of the guide. */
  replayGuide = (): void => {
    this.strokeGuide?.play();
  };
}
