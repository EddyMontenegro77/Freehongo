import { TestBed } from '@angular/core/testing';
import { QuizSyncService } from './quiz-sync.service';

describe('QuizSyncService', () => {
  let service: QuizSyncService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QuizSyncService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
