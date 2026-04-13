import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { JapaneseService } from '../../../shared/services/japanese/japanese.service';
import { CharacterType } from '../../../shared/models/japanese/character.type';
import {
  Character,
  KanaCharacter,
  KanjiCharacter,
} from '../../../shared/models/japanese/character.model';

@Injectable({
  providedIn: 'root',
})
export class CharacterInfoFacadeService {
  constructor(private japaneseService: JapaneseService) {}

  loadCharacterInfo(unicode: string, type: CharacterType): Observable<Character> {
    if (type === 'kana') return this.loadKanaCharacter(unicode);
    else return this.loadKanjiCharacter(unicode);
  }

  loadKanaCharacter(unicode: string): Observable<KanaCharacter> {
    return this.japaneseService.getKana(unicode).pipe(
      map((character) => ({
        ...character,
        kind: 'kana' as const,
      })),
    );
  }

  loadKanjiCharacter(unicode: string): Observable<KanjiCharacter> {
    return this.japaneseService.getKanji(unicode).pipe(
      map((character) => ({
        ...character,
        kind: 'kanji' as const,
      })),
    );
  }

  loadExpectedUrl(unicode: string, type: CharacterType): string {
    if (type == 'kanji') return this.japaneseService.getKanjiSVG(unicode);
    else return this.japaneseService.getKanaSVG(unicode);
  }
}
