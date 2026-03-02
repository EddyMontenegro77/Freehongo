import { TestBed } from '@angular/core/testing';

import { StrokeService } from './stroke.service';
import { Stroke } from '../models/stroke.model';

describe('StrokeService', () => {
  let service: StrokeService;

  const testStroke = new Stroke();
  testStroke.addPoint({ x: 0, y: 0 });

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StrokeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add a stroke', () => {
    service.addStroke(testStroke);

    expect(service.strokes).toHaveLength(1);
  });

  it('should get strokes', () => {
    service.addStroke(testStroke);
    const result = service.getStrokes();

    expect(result).toHaveLength(1);
    expect(result).toContain(testStroke);
  });

  it('should clean strokes', () => {
    service.cleanStrokes();
    expect(service.strokes).toHaveLength(0);
  });

  it('should clear strokes', () => {
    service.addStroke(testStroke);
    service.cleanStrokes();

    expect(service.strokes).toHaveLength(0);
  });

  it('should remove strokes', () => {
    service.addStroke(testStroke);
    const result = service.removeStroke(0);

    expect(result).toEqual(testStroke);
    expect(service.strokes).toHaveLength(0);
  });

  it('should return null after attempting to remove an element of an empty strokes array', () => {
    service.cleanStrokes();
    const result = service.removeStroke(0);

    expect(result).toBeNull();
  });
});
