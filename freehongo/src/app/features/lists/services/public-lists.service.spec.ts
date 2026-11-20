import { TestBed } from '@angular/core/testing';
import { PublicListsService } from './public-lists.service.js';

describe('PublicListsServiceTs', () => {
  let service: PublicListsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PublicListsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
