import { TestBed } from '@angular/core/testing';

import { StrokeValidationService } from './stroke-validation.service';

describe('StrokeValidationService', () => {
  let service: StrokeValidationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StrokeValidationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
