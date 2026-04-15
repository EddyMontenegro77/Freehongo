import { Kana } from './kana.model';
import { Kanji } from './kanji.model';

export type KanaCharacter = Kana & {
  kind: 'kana';
};

export type KanjiCharacter = Kanji & {
  kind: 'kanji';
};

export type Character = KanaCharacter | KanjiCharacter;
