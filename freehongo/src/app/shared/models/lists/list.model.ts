import { Character } from '../japanese/character.model';

export type CharacterListType = 'hiragana' | 'katakana' | 'kanji' | 'mixed';

export class CharacterList {
  listId: string = '';
  name: string = '';
  type: CharacterListType = 'mixed';
  characters: string[] = []; // unicodes
  createdAt?: Date;
  updatedAt?: Date;
  syncStatus?: 'synced' | 'pending' | 'local-only' = 'local-only';
}

export class ResolvedCharacterList {
  listId: string = '';
  name: string = '';
  type: CharacterListType = 'mixed';
  characters: Character[] = [];
  createdAt?: Date;
}

export class CreateCharacterListInput {
  name: string = '';
  type: CharacterListType = 'mixed';
  characters: string[] = [];
}

export function shuffleCharacters(characters: string[]): string[] {
  const result = [...characters];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
