import { CharacterType } from './character.type';

export function isValidCharacterType(type: CharacterType | string): type is CharacterType {
  return type === 'kana' || type === 'kanji';
}

export function isValidUnicode(unicode: string): boolean {
  return /^[0-9a-fA-F]+$/.test(unicode);
}
