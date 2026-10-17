import { describe, expect, it } from 'vitest';
import { expandUuid, shortenUuid } from './urls.utils';

describe('urls.utils', () => {
  const uuid = '481476ec-b9a1-4fc9-b5a7-ff67b4c756e8';

  it('round-trips a uuid', () => {
    expect(expandUuid(shortenUuid(uuid))).toBe(uuid);
  });

  it('produces 22 url-safe characters', () => {
    expect(shortenUuid(uuid)).toMatch(/^[A-Za-z0-9_-]{22}$/);
  });

  it('throws on an invalid id', () => {
    expect(() => expandUuid('list-1')).toThrow();
  });
});
