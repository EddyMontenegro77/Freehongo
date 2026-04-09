import { Component, input, signal } from '@angular/core';
import { CharacterMeta } from '../../components/character-meta/character-meta';
import { CharacterInfoFacadeService } from '../../services/character-info.facade.service';
import { CharacterType } from '../../../../shared/models/japanese/character.type';
import { Character } from '../../../../shared/models/japanese/character.model';
import { LoadingState } from '../../../../shared/components/app-state/loading-state/loading-state';
import { ErrorState } from '../../../../shared/components/app-state/error-state/error-state';

@Component({
  selector: 'app-character-info',
  standalone: true,
  imports: [CharacterMeta, LoadingState, ErrorState],
  templateUrl: './character-info.html',
  styleUrl: './character-info.scss',
})
export class CharacterInfo {
  type = input.required<CharacterType>();
  unicode = input.required<string>();

  character = signal<Character | null>(null);
  isLoading = signal<boolean>(true);
  loadError = signal<string | null>(null);

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
      },
      error: (err: unknown) => {
        console.error(err);
        this.isLoading.set(false);
        this.loadError.set('Could not load character');
        this.character.set(null);
      },
    });
  };
}
