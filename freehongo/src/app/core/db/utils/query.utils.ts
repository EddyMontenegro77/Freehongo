import { IndexableType, Table } from 'dexie';

export function indexBy<T, K>(items: readonly T[], getKey: (item: T) => K): Map<K, T> {
  return new Map(items.map((item) => [getKey(item), item]));
}

export function groupBy<T, K>(items: readonly T[], getKey: (item: T) => K): Map<K, T[]> {
  const groups = new Map<K, T[]>();

  for (const item of items) {
    const key = getKey(item);
    const group = groups.get(key);

    if (group) {
      group.push(item);
    } else {
      groups.set(key, [item]);
    }
  }

  return groups;
}

export function join<L, R, K>(
  left: readonly L[],
  right: readonly R[],
  getLeftKey: (item: L) => K,
  getRightKey: (item: R) => K,
): Array<[L, R]> {
  const rightGroups = groupBy(right, getRightKey);
  const pairs: Array<[L, R]> = [];

  for (const leftItem of left) {
    const matches = rightGroups.get(getLeftKey(leftItem));
    if (!matches) continue;

    for (const rightItem of matches) {
      pairs.push([leftItem, rightItem]);
    }
  }

  return pairs;
}

export function leftJoin<L, R, K>(
  left: readonly L[],
  right: readonly R[],
  getLeftKey: (item: L) => K,
  getRightKey: (item: R) => K,
): Array<[L, R | undefined]> {
  const rightGroups = groupBy(right, getRightKey);
  const pairs: Array<[L, R | undefined]> = [];

  for (const leftItem of left) {
    const matches = rightGroups.get(getLeftKey(leftItem));

    if (!matches) {
      pairs.push([leftItem, undefined]);
      continue;
    }

    for (const rightItem of matches) {
      pairs.push([leftItem, rightItem]);
    }
  }

  return pairs;
}

export function sumBy<T>(items: readonly T[], getValue: (item: T) => number): number {
  return items.reduce((sum, item) => sum + getValue(item), 0);
}

export function dayKey(date: Date | string | number): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function whereIn<T, K>(
  table: Table<T, K>,
  index: string,
  values: Iterable<IndexableType>,
): Promise<T[]> {
  const list = [...values];
  return list.length ? table.where(index).anyOf(list).toArray() : Promise.resolve([]);
}

export function whereBetween<T, K>(
  table: Table<T, K>,
  index: string,
  from?: IndexableType,
  to?: IndexableType,
): Promise<T[]> {
  if (from !== undefined && to !== undefined) {
    return table.where(index).between(from, to, true, true).toArray();
  }
  if (from !== undefined) {
    return table.where(index).aboveOrEqual(from).toArray();
  }
  if (to !== undefined) {
    return table.where(index).belowOrEqual(to).toArray();
  }
  return table.toArray();
}
