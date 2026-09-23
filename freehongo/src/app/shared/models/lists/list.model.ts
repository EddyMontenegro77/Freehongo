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
