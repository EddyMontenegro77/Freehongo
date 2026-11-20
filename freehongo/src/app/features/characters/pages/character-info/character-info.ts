import { Component, input, signal, ChangeDetectionStrategy } from '@angular/core';
import { CharacterMeta } from '../../components/character-meta/character-meta';
import { CharacterInfoFacadeService } from '../../services/character-info.facade.service';
import { CharacterType } from '../../../../shared/models/japanese/character.type';
import { Character } from '../../../../shared/models/japanese/character.model';
import { LoadingState } from '../../../../shared/components/app-state/loading-state/loading-state';
import { ErrorState } from '../../../../shared/components/app-state/error-state/error-state';
import { Stroke } from '../../../../shared/models/writing/stroke.model';

@Component({
  selector: 'app-character-info',
  standalone: true,
  imports: [CharacterMeta, LoadingState, ErrorState],
  templateUrl: './character-info.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './character-info.scss',
})
export class CharacterInfo {
  type = input.required<CharacterType>();
  unicode = input.required<string>();

  character = signal<Character | null>(null);
  expectedUrl = signal<string>('');
  isLoading = signal<boolean>(true);
  loadError = signal<string | null>(null);
  strokes = signal<Stroke[]>([]);

  constructor(private characterInfoFacade: CharacterInfoFacadeService) {}

  ngOnInit() {
    this.loadCharacterInfo();
  }

  loadCharacterInfo = () => {
    this.isLoading.set(true);
    this.loadError.set(null);
    this.character.set(null);
    this.characterInfoFacade.loadCharacterInfo(this.unicode(), this.type()).subscribe({
      next: (result: Character) => {
        this.character.set(result);
        this.isLoading.set(false);
        this.loadError.set(null);
        const expectedCharacterUrl = this.characterInfoFacade.loadExpectedUrl(
          this.unicode(),
          this.type(),
        );
        this.expectedUrl.set(expectedCharacterUrl);
        this.loadStrokes();
      },
      error: (err: unknown) => {
        console.error(err);
        this.isLoading.set(false);
        this.loadError.set('Could not load character');
        this.character.set(null);
        this.expectedUrl.set('');
      },
    });
  };

  private loadStrokes(): void {
    this.characterInfoFacade.loadStrokes(this.unicode(), this.type()).subscribe({
      next: (strokes) => this.strokes.set(strokes),
      error: () => this.strokes.set([]),
    });
  }
}
