import { HttpErrorResponse } from '@angular/common/http';
import {
  classifyError,
  emptyPullResult,
  fetchAllPages,
  mapWithConcurrency,
  toTime,
} from './sync.utils';

describe('sync utilities', () => {
  it('classifies transport, transient and permanent errors', () => {
    expect(classifyError(new HttpErrorResponse({ status: 0 }))).toBe('abort');
    expect(classifyError(new HttpErrorResponse({ status: 429 }))).toBe('transient');
    expect(classifyError(new Error('bad payload'))).toBe('permanent');
  });

  it('parses timestamps and creates an empty pull result', () => {
    expect(toTime('2026-01-01T00:00:00.000Z')).toBe(1767225600000);
    expect(toTime('not-a-date')).toBe(0);
    expect(emptyPullResult()).toEqual({ fetched: 0, inserted: 0, updated: 0, removed: 0, failed: 0, errors: [] });
  });

  it('fetches pages until the short page', async () => {
    const pages = vi.fn()
      .mockResolvedValueOnce(['a', 'b'])
      .mockResolvedValueOnce(['c']);

    await expect(fetchAllPages(pages, 2)).resolves.toEqual(['a', 'b', 'c']);
    expect(pages).toHaveBeenNthCalledWith(2, 2, 2);
  });

  it('preserves task order while collecting fulfilled and rejected work', async () => {
    const result = await mapWithConcurrency([1, 2, 3], 2, async (value) => {
      if (value === 2) throw new Error('failed');
      return value * 2;
    });

    expect(result).toEqual([
      { status: 'fulfilled', value: 2 },
      { status: 'rejected', reason: expect.any(Error) },
      { status: 'fulfilled', value: 6 },
    ]);
  });
});
