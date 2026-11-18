import { HttpErrorResponse } from '@angular/common/http';
import { PullResult } from '../sync/models/sync.models';

export type SyncErrorKind = 'abort' | 'transient' | 'permanent';

export function classifyError(error: unknown): SyncErrorKind {
  if (error instanceof HttpErrorResponse) {
    const status = error.status;
    if (status === 0 || status === 401 || status === 403) return 'abort';
    if (status === 408 || status === 429 || status >= 500) return 'transient';
  }
  return 'permanent';
}

export function isHttpStatus(error: unknown, status: number): boolean {
  return error instanceof HttpErrorResponse && error.status === status;
}

export function toIsoString(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value;
}

export function toTime(value: string | Date | null | undefined): number {
  if (!value) return 0;
  const time = Date.parse(toIsoString(value));
  return Number.isNaN(time) ? 0 : time;
}

export function emptyPullResult(): PullResult {
  return { fetched: 0, inserted: 0, updated: 0, removed: 0, failed: 0, errors: [] };
}

export async function fetchAllPages<T>(
  fetchPage: (limit: number, offset: number) => Promise<T[]>,
  pageSize = 100,
  maxPages = 200,
): Promise<T[]> {
  const all: T[] = [];

  for (let page = 0; page < maxPages; page++) {
    const items = await fetchPage(pageSize, page * pageSize);
    all.push(...items);

    if (items.length < pageSize) return all;
  }

  throw new Error(`Pagination exceeded ${maxPages} pages.`);
}

export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  const results = new Array<PromiseSettledResult<R>>(items.length);
  let next = 0;

  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      try {
        results[index] = { status: 'fulfilled', value: await task(items[index]) };
      } catch (reason) {
        results[index] = { status: 'rejected', reason };
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
