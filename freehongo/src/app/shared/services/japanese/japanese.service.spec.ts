import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { JapaneseService } from './japanese.service';
import { firstValueFrom } from 'rxjs';
import { KanjiData } from '../../models/japanese/kanji.model';
import { KanaData } from '../../models/japanese/kana.model';
import { Stroke } from '../../models/writing/stroke.model';

describe('JapaneseService', () => {
  let service: JapaneseService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [JapaneseService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(JapaneseService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should map kanji strokes to Stroke instances', () => {
    const mockResponse: KanjiData = {
      unicode: '4e00',
      literal: '一',
      stroke_count: 1,
      strokes: [
        [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
        ],
      ],
      readings: { ja_on: ['イチ'] },
      meanings: { en: ['one'] },
      nanori: [],
    };

    service.getKanji('4e00').subscribe((kanji) => {
      expect(kanji.unicode).toBe('4e00');
      expect(kanji.strokes).toHaveLength(1);
      expect(kanji.strokes[0]).toBeInstanceOf(Stroke);
      expect(kanji.strokes[0].getPoints()).toEqual([
        { x: 0, y: 0 },
        { x: 10, y: 0 },
      ]);
    });

    const req = httpMock.expectOne('http://localhost:2582/api/kanji/4e00');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should map kana strokes to Stroke instances', () => {
    const mockResponse: KanaData = {
      unicode: '3042',
      literal: 'あ',
      type: 'hiragana',
      stroke_count: 2,
      reading: 'a',
      strokes: [
        [
          { x: 1, y: 2 },
          { x: 3, y: 4 },
        ],
        [
          { x: 5, y: 6 },
          { x: 7, y: 8 },
        ],
      ],
    };

    service.getKana('3042').subscribe((kana) => {
      expect(kana.unicode).toBe('3042');
      expect(kana.strokes).toHaveLength(2);
      expect(kana.strokes[0]).toBeInstanceOf(Stroke);
      expect(kana.strokes[1]).toBeInstanceOf(Stroke);
      expect(kana.strokes[0].getPoints()).toEqual([
        { x: 1, y: 2 },
        { x: 3, y: 4 },
      ]);
      expect(kana.strokes[1].getPoints()).toEqual([
        { x: 5, y: 6 },
        { x: 7, y: 8 },
      ]);
    });

    const req = httpMock.expectOne('http://localhost:2582/api/kana/3042');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should propagate kanji errors', async () => {
    const status = 404;
    const statusText = 'Not Found';

    const promise = firstValueFrom(service.getKanji('4e00'));

    const req = httpMock.expectOne('http://localhost:2582/api/kanji/4e00');
    expect(req.request.method).toBe('GET');
    req.flush({ error: 'kanji not found' }, { status, statusText });

    await expect(promise).rejects.toEqual({ error: 'kanji not found' });
  });

  it('should propagate kana errors', async () => {
    const status = 500;
    const statusText = 'Internal Server Error';

    const promise = firstValueFrom(service.getKana('3042'));

    const req = httpMock.expectOne('http://localhost:2582/api/kana/3042');
    expect(req.request.method).toBe('GET');
    req.flush({ error: 'internal error' }, { status, statusText });

    await expect(promise).rejects.toEqual({ error: 'internal error' });
  });
});
