import { Character } from '../japanese/character.model';

export class List {
  listId: string = '';
  name: string = '';
  description?: string = '';
  type: 'hiragana' | 'katakana' | 'kanji' | 'mixed' = 'kanji';
  characters: string[] = []; // unicodes
  createdAt?: Date;
  updatedAt?: Date;
  syncStatus?: 'synced' | 'pending' | 'local-only' = 'local-only';
}

export class ResolvedList {
  listId: string = '';
  name: string = '';
  description?: string = '';
  type: 'hiragana' | 'katakana' | 'kanji' | 'mixed' = 'kanji';
  characters: Character[] = [];
  createdAt?: Date;
}

export class CreateListInput {
  name: string = '';
  description?: string = '';
  type: 'hiragana' | 'katakana' | 'kanji' | 'mixed' = 'kanji';
  characters: string[] = [];
}
