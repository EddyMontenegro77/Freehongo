import { Point } from '../writing/point.interface';
import { Stroke } from '../writing/stroke.model';

export interface Kana {
  unicode: string;
  literal: string;
  type: string;
  stroke_count: number;
  reading: string;
}

export interface KanaData {
  unicode: string;
  literal: string;
  type: string;
  stroke_count: number;
  reading: string;
}

export interface KanaDisplay {
  unicode: string;
  literal: string;
}

/**
 * Paged kana display response returned by the backend.
 */
export interface KanaDisplayPage {
  items: KanaDisplay[];
  total_count: number;
}

export interface KanaDisplayParams {
  unicode?: string;
  literal?: string;
  type?: string;
  reading?: string;
  offset?: number;
}

export interface KanaWriting {
  unicode: string;
  literal: string;
  stroke_count: number;
  strokes: Stroke[];
}

export interface KanaWritingData {
  unicode: string;
  literal: string;
  stroke_count: number;
  strokes: Point[][];
}

export interface KanaError {
  error: string;
}
