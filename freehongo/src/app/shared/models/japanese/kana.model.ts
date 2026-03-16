import { Point } from '../writing/point.interface';
import { Stroke } from '../writing/stroke.model';

export interface Kana {
  unicode: string;
  literal: string;
  type: string;
  stroke_count: number;
  strokes: Stroke[];
}

export interface KanaData {
  unicode: string;
  literal: string;
  type: string;
  stroke_count: number;
  strokes: Point[][];
}

export interface KanaError {
  error: string;
}
