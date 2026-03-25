import { Injectable } from '@angular/core';
import { JapaneseService } from '../../../shared/services/japanese/japanese.service';
import { Kanji, KanjiWriting } from '../../../shared/models/japanese/kanji.model';
import { Kana, KanaWriting } from '../../../shared/models/japanese/kana.model';
import { map, Observable } from 'rxjs';
import { CharacterType } from '../../../shared/models/japanese/character.type';

export interface ExpectedCharacterViewModel {
  character: KanjiWriting | KanaWriting;
  expectedUrl: string;
}

@Injectable({
  providedIn: 'root',
})
export class CanvasWritingFacadeService {
  constructor(private japaneseService: JapaneseService) {}

  loadExpectedCharacter(
    unicode: string,
    type: CharacterType,
  ): Observable<ExpectedCharacterViewModel> {
    switch (type) {
      case 'kana':
        return this.japaneseService.getKanaWriting(unicode).pipe(
          map((character) => ({
            character,
            expectedUrl: this.japaneseService.getKanaSVG(unicode),
          })),
        );
      case 'kanji':
        return this.japaneseService.getKanjiWriting(unicode).pipe(
          map((character) => ({
            character,
            expectedUrl: this.japaneseService.getKanjiSVG(unicode),
          })),
        );
      default:
        throw new Error(`Unsupported character type: ${type}`);
    }
  }
}
