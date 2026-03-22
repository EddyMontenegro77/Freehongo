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
  strokes: Stroke[];
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
  strokes: Point[][];
  readings: { [type: string]: string[] };
  meanings: { [language: string]: string[] };
  nanori: string[];
}

export interface KanjiError {
  error: string;
}
