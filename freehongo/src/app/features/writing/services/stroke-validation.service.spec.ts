import { TestBed } from '@angular/core/testing';

import { StrokeValidationService } from './stroke-validation.service';
import { Point } from '../../../shared/models/writing/point.interface';
import { Stroke } from '../../../shared/models/writing/stroke.model';

describe('StrokeValidationService', () => {
  let service: StrokeValidationService;

  function createStroke(points: Point[]): Stroke {
    const stroke = new Stroke();
    stroke.setPoints(points);
    return stroke;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StrokeValidationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return wrong-amount when stroke count differs', () => {
    const input = [
      createStroke([
        { x: 0, y: 0 },
        { x: 50, y: 0 },
      ]),
    ];
    const expected = [
      createStroke([
        { x: 0, y: 0 },
        { x: 50, y: 0 },
      ]),
      createStroke([
        { x: 0, y: 0 },
        { x: 0, y: 50 },
      ]),
    ];

    const result = service.validateSequence(input, expected);

    expect(result.isValidSequence).toBe(false);
    expect(result.sequenceErrorType).toBe('wrong-amount');
  });

  it('should validate a correct sequence', () => {
    const input = [
      createStroke([
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ]),
      createStroke([
        { x: 50, y: 0 },
        { x: 50, y: 100 },
      ]),
    ];
    const expected = [
      createStroke([
        { x: 0, y: 0 },
        { x: 120, y: 0 },
      ]),
      createStroke([
        { x: 60, y: 0 },
        { x: 60, y: 110 },
      ]),
    ];

    const result = service.validateSequence(input, expected);

    expect(result.sequenceErrorType).toBe('none');
    expect(result.isValidSequence).toBe(true);
    expect(result.strokeResults.every((strokeResult) => strokeResult.errorType === 'none')).toBe(
      true,
    );
  });

  it('should flag wrong-direction on a reversed stroke', () => {
    const input = [
      createStroke([
        { x: 100, y: 0 },
        { x: 0, y: 0 },
      ]),
    ];
    const expected = [
      createStroke([
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ]),
    ];

    const result = service.validateSequence(input, expected);

    expect(result.sequenceErrorType).toBe('none');
    expect(result.isValidSequence).toBe(false);
    expect(result.strokeResults[0].errorType).toBe('wrong-direction');
  });

  it('should flag wrong-shape when direction matches but form differs', () => {
    const input = [
      createStroke([
        { x: 0, y: 0 },
        { x: 25, y: 40 },
        { x: 50, y: -40 },
        { x: 75, y: 40 },
        { x: 100, y: 0 },
      ]),
    ];
    const expected = [
      createStroke([
        { x: 0, y: 0 },
        { x: 25, y: 0 },
        { x: 50, y: 0 },
        { x: 75, y: 0 },
        { x: 100, y: 0 },
      ]),
    ];

    const result = service.validateSequence(input, expected);

    expect(result.sequenceErrorType).toBe('none');
    expect(result.isValidSequence).toBe(false);
    expect(result.strokeResults[0].errorType).toBe('wrong-shape');
  });

  it('should return wrong-order when strokes are swapped', () => {
    const horizontal = createStroke([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ]);
    const vertical = createStroke([
      { x: 0, y: 0 },
      { x: 0, y: 100 },
    ]);

    const input = [vertical, horizontal];
    const expected = [horizontal, vertical];

    const result = service.validateSequence(input, expected);

    expect(result.sequenceErrorType).toBe('wrong-order');
    expect(result.isValidSequence).toBe(false);
  });
});
