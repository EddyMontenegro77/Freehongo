import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, tap, throwError } from 'rxjs';
import { Kanji, KanjiData, KanjiError } from '../../models/japanese/kanji.model';
import { Kana, KanaData, KanaError } from '../../models/japanese/kana.model';
import { Stroke } from '../../models/writing/stroke.model';
import { environment } from '../../../../environments/environments';

@Injectable({
  providedIn: 'root',
})
export class JapaneseService {
  private apiUrl = 'http://localhost:2582/api';

  constructor(private http: HttpClient) {}

  getKanji(unicode: string): Observable<Kanji> {
    return this.http.get<KanjiData>(`${this.apiUrl}/kanji/${unicode}`).pipe(
      // Convert raw Point[][] from API into Stroke[] for canvas rendering
      map((data: KanjiData) => ({
        ...data,
        strokes: data.strokes.map((s) => Stroke.fromStrokeData(s)),
      })),
      catchError((error) => throwError(() => error.error as KanjiError)),
    );
  }

  getKana(unicode: string): Observable<Kana> {
    return this.http.get<KanaData>(`${this.apiUrl}/kana/${unicode}`).pipe(
      // Convert raw Point[][] from API into Stroke[] for canvas rendering
      map((data: KanaData) => ({
        ...data,
        strokes: data.strokes.map((s) => Stroke.fromStrokeData(s)),
      })),
      catchError((error) => throwError(() => error.error as KanaError)),
    );
  }

  getKanaSVG(unicode: string): string {
    return `${environment.supabaseUrl}/storage/v1/object/public/japanese-characters/kana/${unicode}.svg`;
  }

  getKanjiSVG(unicode: string): string {
    return `${environment.supabaseUrl}/storage/v1/object/public/japanese-characters/kanji/${unicode}.svg`;
  }
}
