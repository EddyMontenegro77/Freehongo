import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';

import { CanvasWritingFacadeService } from './canvas-writing.facade.service';
import { JapaneseService } from '../../../shared/services/japanese/japanese.service';

describe('CanvasWritingFacadeService', () => {
  let service: CanvasWritingFacadeService;
  const japaneseServiceMock = {
    getKana: vi.fn(),
    getKanji: vi.fn(),
    getKanaSVG: vi.fn(),
    getKanjiSVG: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [{ provide: JapaneseService, useValue: japaneseServiceMock }],
    });
    service = TestBed.inject(CanvasWritingFacadeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load kana with expected url', async () => {
    japaneseServiceMock.getKana.mockReturnValue(of({ strokes: [] }));
    japaneseServiceMock.getKanaSVG.mockReturnValue('kana.svg');

    const result = await firstValueFrom(service.loadExpectedCharacter('3043', 'kana'));

    expect(result.expectedUrl).toBe('kana.svg');
    expect(result.character).toEqual({ strokes: [] });
    expect(japaneseServiceMock.getKana).toHaveBeenCalledWith('3043');
  });

  it('should load kanji with expected url', async () => {
    japaneseServiceMock.getKanji.mockReturnValue(of({ strokes: [] }));
    japaneseServiceMock.getKanjiSVG.mockReturnValue('kanji.svg');

    const result = await firstValueFrom(service.loadExpectedCharacter('4e00', 'kanji'));

    expect(result.expectedUrl).toBe('kanji.svg');
    expect(result.character).toEqual({ strokes: [] });
    expect(japaneseServiceMock.getKanji).toHaveBeenCalledWith('4e00');
  });
});
