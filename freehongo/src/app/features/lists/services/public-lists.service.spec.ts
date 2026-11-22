import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environments';
import { PublicListsService } from './public-lists.service';

describe('PublicListsServiceTs', () => {
  let service: PublicListsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(PublicListsService);
    http = TestBed.inject(HttpTestingController);
  });

  it('builds a public preview request with filters and pagination', () => {
    service.getPreview('official', { name: ' N5 ', listType: 'kanji', limit: 20, offset: 40 }).subscribe();
    const request = http.expectOne((req) => req.url === `${environment.apiUrl}/lists/official/preview`);

    expect(request.request.params.get('name')).toBe(' N5 ');
    expect(request.request.params.get('listType')).toBe('kanji');
    expect(request.request.params.get('offset')).toBe('40');
    request.flush({ lists: [] });
  });

  it('builds a detail request for the selected source', () => {
    service.getDetail('public', 'list-1').subscribe();
    const request = http.expectOne((req) => req.url === `${environment.apiUrl}/lists/public/detail`);

    expect(request.request.params.get('listId')).toBe('list-1');
    request.flush({});
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
