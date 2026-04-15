import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { JapaneseService } from './japanese.service';
import { firstValueFrom } from 'rxjs';
import { KanjiData, KanjiWritingData } from '../../models/japanese/kanji.model';
import { KanaData, KanaWritingData } from '../../models/japanese/kana.model';
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
    const mockResponse: KanjiWritingData = {
      unicode: '4e00',
      literal: '一',
      stroke_count: 1,
      strokes: [
        [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
        ],
      ],
    };

    service.getKanjiWriting('4e00').subscribe((kanji) => {
      expect(kanji.unicode).toBe('4e00');
      expect(kanji.strokes).toHaveLength(1);
      expect(kanji.strokes[0]).toBeInstanceOf(Stroke);
      expect(kanji.strokes[0].getPoints()).toEqual([
        { x: 0, y: 0 },
        { x: 10, y: 0 },
      ]);
    });

    const req = httpMock.expectOne('http://localhost:2582/api/kanji/writing/4e00');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should map kana strokes to Stroke instances', () => {
    const mockResponse: KanaWritingData = {
      unicode: '3042',
      literal: 'あ',
      stroke_count: 2,
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

    service.getKanaWriting('3042').subscribe((kana) => {
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

    const req = httpMock.expectOne('http://localhost:2582/api/kana/writing/3042');
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

  it('should request kana display with query params', async () => {
    const displayPromise = firstValueFrom(
      service.getKanaDisplay({
        unicode: '3042',
        literal: 'あ',
        type: 'hiragana',
        reading: 'a',
        offset: 20,
      }),
    );

    const req = httpMock.expectOne(
      (request) =>
        request.url === 'http://localhost:2582/api/kana/display' &&
        request.params.get('unicode') === '3042' &&
        request.params.get('literal') === 'あ' &&
        request.params.get('type') === 'hiragana' &&
        request.params.get('reading') === 'a' &&
        request.params.get('offset') === '20',
    );

    expect(req.request.method).toBe('GET');
    req.flush({
      items: [
        {
          unicode: '3042',
          literal: 'あ',
        },
      ],
      total_count: 1,
    });

    expect(await displayPromise).toEqual({
      items: [
        {
          unicode: '3042',
          literal: 'あ',
        },
      ],
      total_count: 1,
    });
  });

  it('should request kanji display with query params', async () => {
    const displayPromise = firstValueFrom(
      service.getKanjiDisplay({
        unicode: '65e5',
        literal: '日',
        radicalName: 'sun',
        frequencyOfUse: 42,
        jlptLevel: 4,
        gradeLevel: 'g1',
        reading: 'ニチ',
        meaning: 'sun',
        nanori: 'hi',
        sortBy: 'frequency_of_use',
        offset: 40,
      }),
    );

    const req = httpMock.expectOne(
      (request) =>
        request.url === 'http://localhost:2582/api/kanji/display' &&
        request.params.get('unicode') === '65e5' &&
        request.params.get('literal') === '日' &&
        request.params.get('radical_name') === 'sun' &&
        request.params.get('frequency_of_use') === '42' &&
        request.params.get('jlpt_level') === '4' &&
        request.params.get('grade_level') === 'g1' &&
        request.params.get('reading') === 'ニチ' &&
        request.params.get('meaning') === 'sun' &&
        request.params.get('nanori') === 'hi' &&
        request.params.get('sort_by') === 'frequency_of_use' &&
        request.params.get('offset') === '40',
    );

    expect(req.request.method).toBe('GET');
    req.flush({
      items: [
        {
          unicode: '65e5',
          literal: '日',
        },
      ],
      total_count: 1,
    });

    expect(await displayPromise).toEqual({
      items: [
        {
          unicode: '65e5',
          literal: '日',
        },
      ],
      total_count: 1,
    });
  });

});
