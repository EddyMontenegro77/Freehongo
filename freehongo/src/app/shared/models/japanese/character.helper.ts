import { CharacterType } from './character.type';

export function isValidCharacterType(type: CharacterType | string): type is CharacterType {
  return type === 'kana' || type === 'kanji';
}

export type UnicodeCharacterType = 'hiragana' | 'katakana' | 'kanji' | 'unknown';

export function isValidUnicode(unicode: string): boolean {
  return /^[0-9a-fA-F]+$/.test(unicode);
}

/* Represents unicode as a character */
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
    (codePoint >= 0xf900 && codePoint <= 0xfaff) ||
    // CJK Unified Ideographs extensions for characters outside the BMP.
    (codePoint >= 0x20000 && codePoint <= 0x2a6df) ||
    (codePoint >= 0x2a700 && codePoint <= 0x2b73f) ||
    (codePoint >= 0x2b740 && codePoint <= 0x2b81f) ||
    (codePoint >= 0x2b820 && codePoint <= 0x2ceaf) ||
    (codePoint >= 0x2ceb0 && codePoint <= 0x2ebef) ||
    (codePoint >= 0x2ebf0 && codePoint <= 0x2ee5f) ||
    (codePoint >= 0x30000 && codePoint <= 0x323af) ||
    (codePoint >= 0x2f800 && codePoint <= 0x2fa1f)
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
