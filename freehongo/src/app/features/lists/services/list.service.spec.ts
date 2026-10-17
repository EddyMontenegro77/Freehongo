import { FreeHongoDB } from '../../../core/db/db';
import { ListService } from './list.service';

const T0 = '2026-10-16T10:00:00.000Z';
const T1 = '2026-10-16T11:00:00.000Z';

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
        if (!current) {
          return 0;
        }
        records.set(listId, { ...current, ...changes });
        return 1;
      }),
      delete: vi.fn(async (listId: string) => {
        records.delete(listId);
      }),
      get: vi.fn(async (listId: string) => records.get(listId)),
      filter: vi.fn((predicate: (list: any) => boolean) => ({
        toArray: async () => [...records.values()].filter(predicate),
      })),
      where: vi.fn((field: string) => ({
        equals: (value: unknown) => ({
          and: (predicate: (list: any) => boolean) => ({
            first: async () =>
              [...records.values()].find((record) => record[field] === value && predicate(record)),
          }),
        }),
      })),
    },
    // Runs the callback like Dexie would; the last argument is always the callback.
    transaction: vi.fn(async (...args: unknown[]) =>
      (args[args.length - 1] as () => Promise<unknown>)(),
    ),
  } as unknown as FreeHongoDB;

  beforeEach(() => {
    records.clear();
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(T0));

    service = new ListService();
    (service as any).database = database;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createList', () => {
    it('creates a private list that is pending sync, with matching timestamps', async () => {
      const listId = await service.createList({
        name: 'Basic kana',
        type: 'hiragana',
        characters: ['3042'],
      });

      expect(listId).toEqual(expect.any(String));
      expect(await service.getListById(listId)).toMatchObject({
        listId,
        name: 'Basic kana',
        type: 'hiragana',
        characters: ['3042'],
        isPublic: false,
        syncStatus: 'pending',
        createdAt: T0,
        updatedAt: T0,
      });
    });

    it('trims the name and removes duplicate characters', async () => {
      const listId = await service.createList({
        name: '  Basic kana  ',
        type: 'hiragana',
        characters: ['3042', '3044', '3042'],
      });

      expect(await service.getListById(listId)).toMatchObject({
        name: 'Basic kana',
        characters: ['3042', '3044'],
      });
    });

    it('rejects a blank name without saving anything', async () => {
      await expect(
        service.createList({ name: '   ', type: 'mixed', characters: [] }),
      ).rejects.toThrow('A list needs a name.');

      expect(database.lists.add).not.toHaveBeenCalled();
    });
  });

  describe('updateList', () => {
    it('stamps the change and marks an already synced list as pending again', async () => {
      const listId = await service.createList({ name: 'Old name', type: 'kanji', characters: [] });
      records.get(listId).syncStatus = 'synced';

      vi.setSystemTime(new Date(T1));
      await service.updateList(listId, { name: 'New name' });

      expect(await service.getListById(listId)).toMatchObject({
        name: 'New name',
        syncStatus: 'pending',
        createdAt: T0,
        updatedAt: T1,
      });
    });

    it('trims the name and removes duplicate characters', async () => {
      const listId = await service.createList({ name: 'Kana', type: 'mixed', characters: [] });

      await service.updateList(listId, {
        name: '  Renamed  ',
        characters: ['3042', '3042', '3044'],
      });

      expect(await service.getListById(listId)).toMatchObject({
        name: 'Renamed',
        characters: ['3042', '3044'],
      });
    });

    it('rejects a blank name and leaves the list unchanged', async () => {
      const listId = await service.createList({ name: 'Kana', type: 'mixed', characters: [] });

      await expect(service.updateList(listId, { name: '  ' })).rejects.toThrow(
        'A list needs a name.',
      );

      expect((await service.getListById(listId))?.name).toBe('Kana');
    });
  });

  describe('addCharacterToList', () => {
    it('adds a character only once', async () => {
      const listId = await service.createList({ name: 'Practice', type: 'mixed', characters: [] });

      await expect(service.addCharacterToList(listId, '3042')).resolves.toBe(true);
      await expect(service.addCharacterToList(listId, '3042')).resolves.toBe(false);

      expect((await service.getListById(listId))?.characters).toEqual(['3042']);
    });

    it('marks the list as pending when a character is added', async () => {
      const listId = await service.createList({ name: 'Practice', type: 'mixed', characters: [] });
      records.get(listId).syncStatus = 'synced';

      await service.addCharacterToList(listId, '3042');

      expect((await service.getListById(listId))?.syncStatus).toBe('pending');
    });

    it('throws when the list does not exist', async () => {
      await expect(service.addCharacterToList('missing-list', '3042')).rejects.toThrow(
        'List not found',
      );
    });

    it('throws when the list was deleted', async () => {
      const listId = await service.createList({ name: 'Practice', type: 'mixed', characters: [] });
      await service.deleteList(listId);

      await expect(service.addCharacterToList(listId, '3042')).rejects.toThrow('List not found');
    });
  });

  describe('deleteList', () => {
    it('soft deletes the list so the sync can report the deletion', async () => {
      const listId = await service.createList({ name: 'Old name', type: 'kanji', characters: [] });
      records.get(listId).syncStatus = 'synced';

      vi.setSystemTime(new Date(T1));
      await service.deleteList(listId);

      expect(database.lists.delete).not.toHaveBeenCalled();
      expect(records.get(listId)).toMatchObject({
        deletedAt: T1,
        updatedAt: T1,
        syncStatus: 'pending',
      });
    });

    it('hides a deleted list from every getter', async () => {
      const listId = await service.createList({ name: 'Old name', type: 'kanji', characters: [] });

      await service.deleteList(listId);

      expect(await service.getListById(listId)).toBeUndefined();
      expect(await service.getListByName('Old name')).toBeUndefined();
      expect(await service.getAllLists()).toEqual([]);
    });
  });

  describe('queries', () => {
    it('returns only the lists that are not deleted', async () => {
      const keptId = await service.createList({ name: 'Kept', type: 'mixed', characters: [] });
      const deletedId = await service.createList({ name: 'Gone', type: 'mixed', characters: [] });
      await service.deleteList(deletedId);

      const lists = await service.getAllLists();

      expect(lists.map((list) => list.listId)).toEqual([keptId]);
    });

    it('finds a list by name ignoring surrounding spaces', async () => {
      const listId = await service.createList({
        name: 'Basic kana',
        type: 'hiragana',
        characters: [],
      });

      expect((await service.getListByName('  Basic kana '))?.listId).toBe(listId);
      expect(await service.getListByName('Other')).toBeUndefined();
    });
  });
});
