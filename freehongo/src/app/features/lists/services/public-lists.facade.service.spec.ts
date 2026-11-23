import { TestBed } from '@angular/core/testing';
import { PublicListsFacadeService } from './public-lists.facade.service';

describe('PublicListsFacadeService', () => {
  let service: PublicListsFacadeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PublicListsFacadeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
