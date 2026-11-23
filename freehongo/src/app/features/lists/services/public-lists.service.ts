import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { environment } from '../../../../environments/environments';
import { PublicListInfo, PublicListSource, PublicListsResponse } from '../../../shared/models/lists/list.model';
import { Observable } from 'rxjs';

export interface PublicListsQuery {
  name?: string;
  listType?: string;
  limit: number;
  offset: number;
}

@Service()
export class PublicListsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getPreview(source: PublicListSource, query: PublicListsQuery): Observable<PublicListsResponse> {
    let params = new HttpParams().set('limit', query.limit).set('offset', query.offset);

    if (query.name) params = params.set('name', query.name);
    if (query.listType) params = params.set('listType', query.listType);

    return this.http.get<PublicListsResponse>(`${this.apiUrl}/lists/${source}/preview`, { params });
  }

  getDetail(source: PublicListSource, listId: string): Observable<PublicListInfo> {
    const params = new HttpParams().set('listId', listId);
    return this.http.get<PublicListInfo>(`${this.apiUrl}/lists/${source}/detail`, { params });
  }
}
