import { TestBed } from '@angular/core/testing';

import { StrokeService } from './stroke.service';
import { Stroke } from '../models/stroke.model';
import { Point } from '../models/point.interface';

describe('StrokeService', () => {
  let service: StrokeService;

  function createStroke(points: Point[]): Stroke {
    const stroke = new Stroke();
    stroke.setPoints(points);
    return stroke;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StrokeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add a stroke', () => {
    const testStroke = createStroke([{ x: 0, y: 0 }]);
    service.addStroke(testStroke);

    expect(service.getStrokes()).toHaveLength(1);
  });

  it('should get strokes', () => {
    const testStroke = createStroke([{ x: 0, y: 0 }]);
    service.addStroke(testStroke);
    const result = service.getStrokes();

    expect(result).toHaveLength(1);
    expect(result[0].getPoints()).toEqual(testStroke.getPoints());
    expect(result[0]).not.toBe(testStroke);
  });

  it('should clear strokes', () => {
    const testStroke = createStroke([{ x: 0, y: 0 }]);
    service.addStroke(testStroke);
    service.cleanStrokes();

    expect(service.getStrokes()).toHaveLength(0);
    expect(service.getRedoStack()).toHaveLength(0);
  });

  it('should undo a stroke', () => {
    const testStroke = createStroke([{ x: 0, y: 0 }]);
    service.addStroke(testStroke);

    const result = service.undo();

    expect(result).toBe(true);
    expect(service.getStrokes()).toHaveLength(0);
    expect(service.getRedoStack()).toHaveLength(1);
  });

  it('should return false when undoing with empty strokes', () => {
    expect(service.undo()).toBe(false);
  });

  it('should redo a stroke', () => {
    const testStroke = createStroke([{ x: 0, y: 0 }]);
    service.addStroke(testStroke);
    service.undo();

    const result = service.redo();

    expect(result).toBe(true);
    expect(service.getStrokes()).toHaveLength(1);
    expect(service.getRedoStack()).toHaveLength(0);
    expect(service.getStrokes()[0].getPoints()).toEqual(testStroke.getPoints());
  });

  it('should return false when redoing with empty redo stack', () => {
    expect(service.redo()).toBe(false);
  });

  it('should clear redo stack when adding a new stroke after undo', () => {
    const strokeA = createStroke([{ x: 0, y: 0 }]);
    const strokeB = createStroke([{ x: 1, y: 1 }]);

    service.addStroke(strokeA);
    service.undo();
    expect(service.getRedoStack()).toHaveLength(1);

    service.addStroke(strokeB);
    expect(service.getRedoStack()).toHaveLength(0);
  });
});
