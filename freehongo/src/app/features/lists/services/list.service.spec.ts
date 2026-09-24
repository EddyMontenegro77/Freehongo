import { FreeHongoDB } from '../../../core/db/db';
import { ListService } from './list.service';

describe('ListService', () => {
  let service: ListService;
  const records = new Map<string, any>();
  const database = {
    lists: {
      add: vi.fn(async (list: any) => {
        records.set(list.listId, list);
      }),
      update: vi.fn(async (listId: string, changes: any) => {
        const current = records.get(listId);
        if (current) {
          records.set(listId, { ...current, ...changes });
        }
      }),
      delete: vi.fn(async (listId: string) => {
        records.delete(listId);
      }),
      toArray: vi.fn(async () => [...records.values()]),
      get: vi.fn(async (listId: string) => records.get(listId)),
      where: vi.fn((field: string) => ({
        equals: (value: unknown) => ({
          first: async () => [...records.values()].find((record) => record[field] === value),
        }),
      })),
    },
  } as unknown as FreeHongoDB;

  beforeEach(() => {
    records.clear();
    service = new ListService();
    (service as any).database = database;
  });

  it('creates and retrieves a list by id and name', async () => {
    const listId = await service.createList({
      name: 'Basic kana',
      type: 'hiragana',
      characters: ['3042'],
    });

    const listById = await service.getListById(listId);
    const listByName = await service.getListByName('Basic kana');

    expect(listById).toMatchObject({
      listId,
      name: 'Basic kana',
      type: 'hiragana',
      characters: ['3042'],
      syncStatus: 'local-only',
    });
    expect(listByName?.listId).toBe(listId);
  });

  it('adds a character only once', async () => {
    const listId = await service.createList({
      name: 'Practice',
      type: 'mixed',
      characters: [],
    });

    await expect(service.addCharacterToList(listId, '3042')).resolves.toBe(true);
    await expect(service.addCharacterToList(listId, '3042')).resolves.toBe(false);

    const list = await service.getListById(listId);
    expect(list?.characters).toEqual(['3042']);
  });

  it('updates and deletes a list', async () => {
    const listId = await service.createList({
      name: 'Old name',
      type: 'kanji',
      characters: [],
    });

    await service.updateList(listId, { name: 'New name' });
    expect((await service.getListById(listId))?.name).toBe('New name');

    await service.deleteList(listId);
    await expect(service.getListById(listId)).resolves.toBeUndefined();
  });

  it('throws when adding a character to a missing list', async () => {
    await expect(service.addCharacterToList('missing-list', '3042')).rejects.toThrow(
      'List not found',
    );
  });
});
