import { TestBed } from '@angular/core/testing';
import { CharacterList } from '../../../shared/models/lists/list.model';
import { ListService } from './list.service';
import { ListsFacade } from './lists.facade.service';

function makeList(overrides: Partial<CharacterList> = {}): CharacterList {
  return {
    listId: 'list-1',
    name: 'Kana',
    isPublic: false,
    type: 'hiragana',
    characters: [],
    createdAt: '2026-10-16T10:00:00.000Z',
    updatedAt: '2026-10-16T10:00:00.000Z',
    syncStatus: 'pending',
    ...overrides,
  };
}

describe('ListsFacade', () => {
  let facade: ListsFacade;
  let listService: {
    getAllLists: ReturnType<typeof vi.fn>;
    getListById: ReturnType<typeof vi.fn>;
    createList: ReturnType<typeof vi.fn>;
    addCharacterToList: ReturnType<typeof vi.fn>;
    updateList: ReturnType<typeof vi.fn>;
    deleteList: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    listService = {
      getAllLists: vi.fn(),
      getListById: vi.fn(),
      createList: vi.fn(),
      addCharacterToList: vi.fn(),
      updateList: vi.fn(),
      deleteList: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [ListsFacade, { provide: ListService, useValue: listService }],
    });

    facade = TestBed.inject(ListsFacade);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads and filters lists', async () => {
    const lists = [
      makeList({ listId: '1', name: 'Basic kanji', type: 'kanji' }),
      makeList({ listId: '2', name: 'Hiragana', type: 'hiragana' }),
    ];
    listService.getAllLists.mockResolvedValue(lists);

    await facade.loadLists();

    expect(facade.filteredLists()).toEqual(lists);

    facade.filterLists('basic', 'kanji');

    expect(facade.filteredLists()).toEqual([lists[0]]);
    expect(facade.isLoading()).toBe(false);
    expect(facade.loadError()).toBeNull();
  });

  it('filters by name ignoring case and surrounding spaces', async () => {
    const lists = [
      makeList({ listId: '1', name: 'Basic kanji', type: 'kanji' }),
      makeList({ listId: '2', name: 'Hiragana', type: 'hiragana' }),
    ];
    listService.getAllLists.mockResolvedValue(lists);
    await facade.loadLists();

    facade.filterLists('  HIRA ', 'any');

    expect(facade.filteredLists()).toEqual([lists[1]]);
  });

  it('clears the lists and reports an error when loading fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    listService.getAllLists.mockRejectedValue(new Error('db unavailable'));

    await facade.loadLists();

    expect(facade.lists()).toEqual([]);
    expect(facade.filteredLists()).toEqual([]);
    expect(facade.loadError()).toBe('Could not load lists.');
    expect(facade.isLoading()).toBe(false);
  });

  it('delegates list mutations to the service', async () => {
    listService.createList.mockResolvedValue('new-list');
    listService.addCharacterToList.mockResolvedValue(true);

    const input = { name: 'Practice', type: 'mixed' as const, characters: [] };

    await expect(facade.createList(input)).resolves.toBe('new-list');
    await expect(facade.addCharacterToList('new-list', '3042')).resolves.toBe(true);

    expect(listService.createList).toHaveBeenCalledWith(input);
    expect(listService.addCharacterToList).toHaveBeenCalledWith('new-list', '3042');
  });

  it('updates loaded lists after adding a character', async () => {
    const list = makeList({ listId: 'list-1', characters: [] });
    facade.lists.set([list]);
    facade.filteredLists.set([list]);
    listService.addCharacterToList.mockResolvedValue(true);

    await facade.addCharacterToList('list-1', '3042');

    expect(facade.lists()[0].characters).toEqual(['3042']);
    expect(facade.filteredLists()[0].characters).toEqual(['3042']);
  });

  it('leaves the loaded lists untouched when the character was already there', async () => {
    const list = makeList({ listId: 'list-1', characters: ['3042'] });
    facade.lists.set([list]);
    facade.filteredLists.set([list]);
    listService.addCharacterToList.mockResolvedValue(false);

    await expect(facade.addCharacterToList('list-1', '3042')).resolves.toBe(false);

    expect(facade.lists()[0].characters).toEqual(['3042']);
  });

  it('delegates list updates to the service', async () => {
    const changes = { name: 'Updated name', isPublic: true, characters: ['3042'] };

    await facade.updateList('list-1', changes);

    expect(listService.updateList).toHaveBeenCalledWith('list-1', changes);
  });

  it('delegates list deletion to the service', async () => {
    await facade.deleteList('list-1');

    expect(listService.deleteList).toHaveBeenCalledWith('list-1');
  });

  it('delegates the lookup of a list by id to the service', async () => {
    const list = makeList({ listId: 'list-9' });
    listService.getListById.mockResolvedValue(list);

    await expect(facade.getListById('list-9')).resolves.toBe(list);

    expect(listService.getListById).toHaveBeenCalledWith('list-9');
  });
});
