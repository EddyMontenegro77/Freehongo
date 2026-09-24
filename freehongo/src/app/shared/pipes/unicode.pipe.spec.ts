import { UnicodeCharacterPipe } from './unicode.pipe';

describe('UnicodeCharacterPipe', () => {
  it('converts hexadecimal unicode to a character', () => {
    const pipe = new UnicodeCharacterPipe();

    expect(pipe.transform('3042')).toBe('あ');
    expect(pipe.transform('4e00')).toBe('一');
  });
});
