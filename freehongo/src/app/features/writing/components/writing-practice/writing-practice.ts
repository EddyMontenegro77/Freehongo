import { Component, effect, input, OnInit, signal } from '@angular/core';
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

@Component({
  selector: 'app-writing-practice',
  standalone: true,
  imports: [WritingCanvas, LoadingState, ErrorState],
  templateUrl: './writing-practice.html',
  styleUrl: './writing-practice.scss',
})
export class WritingPractice {
  readonly width = 456;
  readonly height = 456;
  unicode = input.required<string>();
  type = input.required<CharacterType>();
  isLoading = signal<boolean>(false);
  loadError = signal<string | null>(null);
  expectedUrl = signal<string>('');
  expectedStrokes = signal<Stroke[]>([]);

  constructor(private canvasWritingFacadeService: CanvasWritingFacadeService) {}

  ngOnInit() {
    if (!isValidCharacterType(this.type()) || !isValidUnicode(this.unicode())) {
      this.loadError.set('Missing or invalid practice parameters.');
      return;
    }
    this.loadPractice();
  }

  loadPractice = (): void => {
    this.isLoading.set(true);
    this.loadError.set(null);

    this.canvasWritingFacadeService.loadExpectedCharacter(this.unicode(), this.type()).subscribe({
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
  };
}
