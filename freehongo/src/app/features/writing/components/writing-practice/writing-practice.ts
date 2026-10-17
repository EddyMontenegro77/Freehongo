import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  ViewChild,
} from '@angular/core';
import { WritingCanvas } from '../writing-canvas/writing-canvas';
import { CharacterType } from '../../../../shared/models/japanese/character.type';
import { LoadingState } from '../../../../shared/components/app-state/loading-state/loading-state';
import { ErrorState } from '../../../../shared/components/app-state/error-state/error-state';
import { CanvasWritingFacadeService } from '../../services/canvas-writing.facade.service';
import { Stroke } from '../../../../shared/models/writing/stroke.model';
import {
  isValidCharacterType,
  isValidUnicode,
} from '../../../../shared/models/japanese/character.helper';
import {
  DEFAULT_WRITING_UI,
  WritingUiOptions,
  WritingValidationEvent,
} from '../../../../shared/models/quizes/quizes.interface';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-writing-practice',
  standalone: true,
  imports: [WritingCanvas, LoadingState, ErrorState],
  templateUrl: './writing-practice.html',
  styleUrl: './writing-practice.scss',
})
export class WritingPractice {
  @ViewChild(WritingCanvas) private writingCanvas!: WritingCanvas;
  private loadSub?: Subscription;

  readonly width = 456;
  readonly height = 456;
  unicode = input.required<string>();
  type = input.required<CharacterType>();

  readonly ui = input<Partial<WritingUiOptions>>({});
  protected readonly options = computed<WritingUiOptions>(() => ({
    ...DEFAULT_WRITING_UI,
    ...this.ui(),
  }));

  readonly validationCompleted = output<WritingValidationEvent>();

  isLoading = signal<boolean>(false);
  loadError = signal<string | null>(null);
  expectedUrl = signal<string>('');
  expectedStrokes = signal<Stroke[]>([]);

  canvasWritingFacadeService = inject(CanvasWritingFacadeService);

  constructor() {
    effect(() => {
      const unicode = this.unicode();
      const type = this.type();
      untracked(() => this.loadPractice(unicode, type));
    });
  }
  private loadPractice(unicode: string, type: CharacterType): void {
    this.loadSub?.unsubscribe();

    if (!isValidCharacterType(type) || !isValidUnicode(unicode)) {
      this.loadError.set('Missing or invalid practice parameters.');
      return;
    }

    this.isLoading.set(true);
    this.loadError.set(null);

    this.loadSub = this.canvasWritingFacadeService.loadExpectedCharacter(unicode, type).subscribe({
      next: ({ character, expectedUrl }) => {
        this.expectedStrokes.set(character.strokes);
        this.expectedUrl.set(expectedUrl);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loadError.set('Could not load practice data.');
        this.isLoading.set(false);
      },
    });
  }

  retry = (): void => {
    this.loadPractice(this.unicode(), this.type());
  };

  validate = async (): Promise<void> => {
    await this.writingCanvas.getSequenceValidationResults();
  };

  reset(): void {
    this.writingCanvas.resetCanvas();
  }
}
