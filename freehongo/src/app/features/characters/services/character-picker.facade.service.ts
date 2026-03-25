import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { JapaneseService } from '../../../shared/services/japanese/japanese.service';
import { CharacterType } from '../../../shared/models/japanese/character.type';
import { kanaType } from '../../../shared/models/japanese/kana.type';
import { KanaDisplay, KanaDisplayParams } from '../../../shared/models/japanese/kana.model';
import { KanjiDisplay, KanjiDisplayParams } from '../../../shared/models/japanese/kanji.model';

export interface CharacterPickerFilters {
  type: CharacterType;
  general?: CharacterPickerGeneralFilters;
  kana?: CharacterPickerKanaFilters;
  kanji?: CharacterPickerKanjiFilters;
  page?: number;
}

/**
 * Shared filters that apply to both kana and kanji searches.
 */
export interface CharacterPickerGeneralFilters {
  unicode?: string;
  literal?: string;
}

/**
 * Kana-specific search filters.
 */
export interface CharacterPickerKanaFilters {
  kanaType?: kanaType;
  kanaReading?: string;
}

/**
 * Kanji-specific search filters and ordering options.
 */
export interface CharacterPickerKanjiFilters {
  radicalName?: string;
  sortBy?: string;
  jlptLevel?: string;
  gradeLevel?: string;
  kanjiReading?: string;
  kanjiMeaning?: string;
  kanjiNanori?: string;
}

export type CharacterPickerItem =
  | (KanaDisplay & { type: 'kana' })
  | (KanjiDisplay & { type: 'kanji' });

@Injectable({
  providedIn: 'root',
})
export class characterPickerFacadeService {
  private readonly pageSize = 20;

  constructor(private japaneseService: JapaneseService) {}

  /**
   * Loads a page of characters using the filter structure from the picker form.
   */
  loadCharacters(filters: CharacterPickerFilters): Observable<CharacterPickerItem[]> {
    return this.loadPage(filters);
  }

  /**
   * Loads the requested page and routes the query to kana or kanji display endpoints.
   */
  loadPage(filters: CharacterPickerFilters): Observable<CharacterPickerItem[]> {
    const page = this.normalizePage(filters.page);
    const offset = this.calculateOffset(page);

    switch (filters.type) {
      case 'kana':
        return this.loadKanaDisplay(filters, offset);
      case 'kanji':
        return this.loadKanjiDisplay(filters, offset);
      default:
        throw new Error(`Unsupported character type: ${filters.type}`);
    }
  }

  private loadKanaDisplay(
    filters: CharacterPickerFilters,
    offset: number,
  ): Observable<CharacterPickerItem[]> {
    const general = filters.general ?? {};
    const kana = filters.kana ?? {};
    const params: KanaDisplayParams = {
      unicode: general.unicode,
      literal: general.literal,
      type: kana.kanaType,
      reading: kana.kanaReading,
      offset,
    };

    return this.japaneseService
      .getKanaDisplay(params)
      .pipe(map((items) => items.map((item) => this.withType(item, 'kana'))));
  }

  private loadKanjiDisplay(
    filters: CharacterPickerFilters,
    offset: number,
  ): Observable<CharacterPickerItem[]> {
    const general = filters.general ?? {};
    const kanji = filters.kanji ?? {};
    const params: KanjiDisplayParams = {
      unicode: general.unicode,
      literal: general.literal,
      radicalName: kanji.radicalName,
      jlptLevel: this.toOptionalNumber(kanji.jlptLevel),
      gradeLevel: kanji.gradeLevel,
      reading: kanji.kanjiReading,
      meaning: kanji.kanjiMeaning,
      nanori: kanji.kanjiNanori,
      sortBy: kanji.sortBy,
      offset,
    };

    return this.japaneseService
      .getKanjiDisplay(params)
      .pipe(map((items) => items.map((item) => this.withType(item, 'kanji'))));
  }

  private withType<T extends KanaDisplay | KanjiDisplay>(
    item: T,
    type: CharacterType,
  ): CharacterPickerItem {
    return {
      ...item,
      type,
    } as CharacterPickerItem;
  }

  private normalizePage(page?: number): number {
    if (!page || page < 1) {
      return 1;
    }

    return page;
  }

  private calculateOffset(page: number): number {
    return (page - 1) * this.pageSize;
  }

  /**
   * Parses numeric kanji filters that may arrive as strings from the form.
   */
  private toOptionalNumber(value?: string): number | undefined {
    if (!value) {
      return undefined;
    }

    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      throw new Error(`Invalid number value: ${value}`);
    }

    return parsed;
  }
}
