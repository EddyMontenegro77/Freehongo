import { TestBed } from '@angular/core/testing';
import { of, firstValueFrom } from 'rxjs';
import { CharacterInfoFacadeService } from './character-info.facade.service';
import { JapaneseService } from '../../../shared/services/japanese/japanese.service';

describe('CharacterInfoFacadeService', () => {
  let service: CharacterInfoFacadeService;

  const japaneseServiceMock = {
    getKana: vi.fn(),
    getKanji: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [{ provide: JapaneseService, useValue: japaneseServiceMock }],
    });

    service = TestBed.inject(CharacterInfoFacadeService);
  });

  it('should load kana character and add kind', async () => {
    japaneseServiceMock.getKana.mockReturnValue(
      of({
        unicode: '3042',
        literal: 'あ',
        type: 'hiragana',
        stroke_count: 3,
        reading: 'a',
      }),
    );

    const result = await firstValueFrom(service.loadCharacterInfo('3042', 'kana'));

    expect(japaneseServiceMock.getKana).toHaveBeenCalledWith('3042');
    expect(result).toEqual({
      unicode: '3042',
      literal: 'あ',
      type: 'hiragana',
      stroke_count: 3,
      reading: 'a',
      kind: 'kana',
    });
  });

  it('should load kanji character and add kind', async () => {
    japaneseServiceMock.getKanji.mockReturnValue(
      of({
        unicode: '65e5',
        literal: '日',
        stroke_count: 4,
        readings: { on: ['ニチ'] },
        meanings: { en: ['sun'] },
        nanori: ['hi'],
      }),
    );

    const result = await firstValueFrom(service.loadCharacterInfo('65e5', 'kanji'));

    expect(japaneseServiceMock.getKanji).toHaveBeenCalledWith('65e5');
    expect(result).toEqual({
      unicode: '65e5',
      literal: '日',
      stroke_count: 4,
      readings: { on: ['ニチ'] },
      meanings: { en: ['sun'] },
      nanori: ['hi'],
      kind: 'kanji',
    });
  });
});
