import { CharacterType } from './character.type';

export function isValidCharacterType(type: CharacterType | string): type is CharacterType {
  return type === 'kana' || type === 'kanji';
}

export type UnicodeCharacterType = 'hiragana' | 'katakana' | 'kanji' | 'unknown';

export function isValidUnicode(unicode: string): boolean {
  return /^[0-9a-fA-F]+$/.test(unicode);
}

export function getCodePoint(unicode: string): number {
  return Number.parseInt(unicode.trim().replace(/^U\+/i, ''), 16);
}

export function getUnicodeCharacterType(unicode: string): UnicodeCharacterType {
  const codePoint = getCodePoint(unicode);

  if (Number.isNaN(codePoint)) {
    return 'unknown';
  }

  if (codePoint >= 0x3040 && codePoint <= 0x309f) {
    return 'hiragana';
  }

  if (codePoint >= 0x30a0 && codePoint <= 0x30ff) {
    return 'katakana';
  }

  if (
    (codePoint >= 0x3400 && codePoint <= 0x4dbf) ||
    (codePoint >= 0x4e00 && codePoint <= 0x9fff) ||
    (codePoint >= 0xf900 && codePoint <= 0xfaff)
  ) {
    return 'kanji';
  }

  return 'unknown';
}

export function getCharacterTypeFromUnicode(unicode: string): CharacterType | 'unknown' {
  const type = getUnicodeCharacterType(unicode);

  if (type === 'hiragana' || type === 'katakana') {
    return 'kana';
  }

  if (type === 'kanji') {
    return 'kanji';
  }

  return 'unknown';
}
