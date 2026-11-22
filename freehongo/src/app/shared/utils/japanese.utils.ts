import { toHiragana, toKatakana, isRomaji, isJapanese } from 'wanakana';

export type JapaneseScript = 'hiragana' | 'katakana';

const UNICODE_HEX = /^(?:u\+)?([0-9a-f]{4,6})$/i;

export function unicodeToChar(input: string): string {
  const match = UNICODE_HEX.exec(input.trim());
  if (!match) return '';

  const codePoint = parseInt(match[1], 16);
  return codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : '';
}

export function convertRomajiToJapanese(
  input: string,
  script: JapaneseScript = 'hiragana',
): string {
  const value = input.trim();
  if (!value) return '';

  if (isJapanese(value)) return value;

  if (!isRomaji(value) || !/^[a-z]+$/i.test(value)) return '';

  const converted = script === 'katakana' ? toKatakana(value) : toHiragana(value);
  return converted === value ? '' : converted;
}
