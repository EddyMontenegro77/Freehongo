import { Point } from '../writing/point.interface';
import { Stroke } from '../writing/stroke.model';

export interface Kana {
  unicode: string;
  literal: string;
  type: string;
  stroke_count: number;
  reading: string;
  strokes: Stroke[];
}

export interface KanaData {
  unicode: string;
  literal: string;
  type: string;
  stroke_count: number;
  reading: string;
  strokes: Point[][];
}

export interface KanaError {
  error: string;
}
