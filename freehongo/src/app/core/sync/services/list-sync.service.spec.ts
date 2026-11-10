import { TestBed } from '@angular/core/testing';
import { ListSyncService } from './list-sync.service';

describe('ListSyncService', () => {
  let service: ListSyncService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ListSyncService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
