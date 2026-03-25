import { Point } from '../writing/point.interface';
import { Stroke } from '../writing/stroke.model';

export interface Kanji {
  unicode: string;
  literal: string;
  stroke_count: number;
  radical_name?: string;
  frequency_of_use?: number;
  jlpt_level?: number;
  grade_level?: number;
  readings: { [type: string]: string[] };
  meanings: { [language: string]: string[] };
  nanori: string[];
}

export interface KanjiData {
  unicode: string;
  literal: string;
  stroke_count: number;
  radical_name?: string;
  frequency_of_use?: number;
  jlpt_level?: number;
  grade_level?: number;
  readings: { [type: string]: string[] };
  meanings: { [language: string]: string[] };
  nanori: string[];
}

export interface KanjiDisplay {
  unicode: string;
  literal: string;
}

export interface KanjiDisplayParams {
  unicode?: string;
  literal?: string;
  radicalName?: string;
  frequencyOfUse?: number;
  jlptLevel?: number;
  gradeLevel?: string;
  reading?: string;
  meaning?: string;
  nanori?: string;
  sortBy?: string;
  offset?: number;
}

export interface KanjiWriting {
  unicode: string;
  literal: string;
  stroke_count: number;
  strokes: Stroke[];
}

export interface KanjiWritingData {
  unicode: string;
  literal: string;
  stroke_count: number;
  strokes: Point[][];
}

export interface KanjiError {
  error: string;
}
