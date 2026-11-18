import { TestBed } from '@angular/core/testing';
import { SyncTriggerService } from './sync-trigger.service';

describe('SyncTriggerService', () => {
  let service: SyncTriggerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SyncTriggerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
