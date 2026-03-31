import { TestBed } from '@angular/core/testing';
import { of, firstValueFrom } from 'rxjs';

import { characterPickerFacadeService } from './character-picker.facade.service';
import { JapaneseService } from '../../../shared/services/japanese/japanese.service';

describe('CharacterPickerFacade', () => {
  let service: characterPickerFacadeService;
  const japaneseServiceMock = {
    getKanaDisplay: vi.fn(),
    getKanjiDisplay: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [{ provide: JapaneseService, useValue: japaneseServiceMock }],
    });

    service = TestBed.inject(characterPickerFacadeService);
  });

  it('should load kana display and enrich items with type', async () => {
    japaneseServiceMock.getKanaDisplay.mockReturnValue(
      of({
        items: [
          { unicode: '3042', literal: 'あ' },
          { unicode: '3044', literal: 'い' },
        ],
        total_count: 2,
      }),
    );

    const result = await firstValueFrom(
      service.loadCharacters({
        type: 'kana',
        general: {
          unicode: '3042',
          literal: 'あ',
        },
        kana: {
          kanaType: 'hiragana',
          kanaReading: 'a',
        },
        page: 2,
      }),
    );

    expect(japaneseServiceMock.getKanaDisplay).toHaveBeenCalledWith({
      unicode: '3042',
      literal: 'あ',
      type: 'hiragana',
      reading: 'a',
      offset: 20,
    });
    expect(result).toEqual({
      items: [
        { unicode: '3042', literal: 'あ', type: 'kana' },
        { unicode: '3044', literal: 'い', type: 'kana' },
      ],
      totalCount: 2,
    });
  });

  it('should load kanji display and convert filters to api params', async () => {
    japaneseServiceMock.getKanjiDisplay.mockReturnValue(
      of({
        items: [
          { unicode: '65e5', literal: '日' },
          { unicode: '672c', literal: '本' },
        ],
        total_count: 2,
      }),
    );

    const result = await firstValueFrom(
      service.loadCharacters({
        type: 'kanji',
        general: {
          unicode: '65e5',
          literal: '日',
        },
        kanji: {
          radicalName: 'sun',
          jlptLevel: '4',
          gradeLevel: 'g1',
          kanjiReading: 'ニチ',
          kanjiMeaning: 'sun',
          kanjiNanori: 'hi',
          sortBy: 'frequency_of_use',
        },
        page: 3,
      }),
    );

    expect(japaneseServiceMock.getKanjiDisplay).toHaveBeenCalledWith({
      unicode: '65e5',
      literal: '日',
      radicalName: 'sun',
      jlptLevel: 4,
      gradeLevel: 'g1',
      reading: 'ニチ',
      meaning: 'sun',
      nanori: 'hi',
      sortBy: 'frequency_of_use',
      offset: 40,
    });
    expect(result).toEqual({
      items: [
        { unicode: '65e5', literal: '日', type: 'kanji' },
        { unicode: '672c', literal: '本', type: 'kanji' },
      ],
      totalCount: 2,
    });
  });

  it('should throw on unsupported character type', () => {
    expect(() =>
      service.loadPage({
        type: 'invalid' as never,
        page: 1,
      }),
    ).toThrow('Unsupported character type: invalid');
  });
});
