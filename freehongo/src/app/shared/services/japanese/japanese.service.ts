import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import {
  KanjiDisplay,
  Kanji,
  KanjiData,
  KanjiError,
  KanjiWriting,
  KanjiWritingData,
  KanjiDisplayParams,
} from '../../models/japanese/kanji.model';
import {
  Kana,
  KanaData,
  KanaError,
  KanaDisplay,
  KanaWriting,
  KanaWritingData,
  KanaDisplayParams,
} from '../../models/japanese/kana.model';
import { Stroke } from '../../models/writing/stroke.model';
import { environment } from '../../../../environments/environments';

@Injectable({
  providedIn: 'root',
})
export class JapaneseService {
  private apiUrl = 'http://localhost:2582/api';

  constructor(private http: HttpClient) {}

  /**
   * Fetches the full kanji record used in detail screens.
   */
  getKanji(unicode: string): Observable<Kanji> {
    return this.http
      .get<KanjiData>(`${this.apiUrl}/kanji/${unicode}`)
      .pipe(catchError((error) => throwError(() => error.error as KanjiError)));
  }

  /**
   * Fetches the full kana record used in detail screens.
   */
  getKana(unicode: string): Observable<Kana> {
    return this.http
      .get<KanaData>(`${this.apiUrl}/kana/${unicode}`)
      .pipe(catchError((error) => throwError(() => error.error as KanaError)));
  }

  /**
   * Builds the public SVG URL for a kana character.
   */
  getKanaSVG(unicode: string): string {
    return `${environment.supabaseUrl}/storage/v1/object/public/japanese-characters/kana/${unicode}.svg`;
  }

  /**
   * Builds the public SVG URL for a kanji character.
   */
  getKanjiSVG(unicode: string): string {
    return `${environment.supabaseUrl}/storage/v1/object/public/japanese-characters/kanji/${unicode}.svg`;
  }

  /**
   * Fetches kana rows for list and picker views with optional filters.
   */
  getKanaDisplay(params: KanaDisplayParams = {}): Observable<KanaDisplay[]> {
    return this.http
      .get<KanaDisplay[]>(`${this.apiUrl}/kana/display`, {
        params: this.buildHttpParams([
          ['unicode', params.unicode],
          ['literal', params.literal],
          ['type', params.type],
          ['reading', params.reading],
          ['offset', params.offset],
        ]),
      })
      .pipe(catchError((error) => throwError(() => error.error as KanaError)));
  }

  /**
   * Fetches kanji rows for list and picker views with optional filters and sorting.
   */
  getKanjiDisplay(params: KanjiDisplayParams = {}): Observable<KanjiDisplay[]> {
    return this.http
      .get<KanjiDisplay[]>(`${this.apiUrl}/kanji/display`, {
        params: this.buildHttpParams([
          ['unicode', params.unicode],
          ['literal', params.literal],
          ['radical_name', params.radicalName],
          ['frequency_of_use', params.frequencyOfUse],
          ['jlpt_level', params.jlptLevel],
          ['grade_level', params.gradeLevel],
          ['reading', params.reading],
          ['meaning', params.meaning],
          ['nanori', params.nanori],
          ['sort_by', params.sortBy],
          ['offset', params.offset],
        ]),
      })
      .pipe(catchError((error) => throwError(() => error.error as KanjiError)));
  }

  /**
   * Fetches kana stroke data and converts the raw point arrays into Stroke instances.
   */
  getKanaWriting(unicode: string): Observable<KanaWriting> {
    return this.http.get<KanaWritingData>(`${this.apiUrl}/kana/writing/${unicode}`).pipe(
      // Convert raw Point[][] from API into Stroke[] for canvas rendering
      map((data: KanaWritingData) => ({
        ...data,
        strokes: data.strokes.map((s) => Stroke.fromStrokeData(s)),
      })),
      catchError((error) => throwError(() => error.error as KanaError)),
    );
  }

  /**
   * Fetches kanji stroke data and converts the raw point arrays into Stroke instances.
   */
  getKanjiWriting(unicode: string): Observable<KanjiWriting> {
    return this.http.get<KanjiWritingData>(`${this.apiUrl}/kanji/writing/${unicode}`).pipe(
      // Convert raw Point[][] from API into Stroke[] for canvas rendering
      map((data: KanjiWritingData) => ({
        ...data,
        strokes: data.strokes.map((s) => Stroke.fromStrokeData(s)),
      })),
      catchError((error) => throwError(() => error.error as KanjiError)),
    );
  }

  /**
   * Builds HttpParams while skipping empty values.
   */
  private buildHttpParams(
    params: ReadonlyArray<readonly [string, string | number | undefined | null]>,
  ): HttpParams {
    let httpParams = new HttpParams();

    for (const [key, value] of params) {
      if (value === undefined || value === null || value === '') {
        continue;
      }

      httpParams = httpParams.set(key, String(value));
    }

    return httpParams;
  }
}
