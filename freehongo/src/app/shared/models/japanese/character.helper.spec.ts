import {
  getCharacterTypeFromUnicode,
  getUnicodeCharacterType,
} from './character.helper';

describe('character helper', () => {
  it('recognizes supplementary-plane kanji', () => {
    expect(getUnicodeCharacterType('26951')).toBe('kanji');
    expect(getCharacterTypeFromUnicode('26951')).toBe('kanji');
  });

  it('keeps kana classification unchanged', () => {
    expect(getUnicodeCharacterType('3042')).toBe('hiragana');
    expect(getCharacterTypeFromUnicode('30A2')).toBe('kana');
  });
});
