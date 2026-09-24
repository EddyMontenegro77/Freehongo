import { TestBed } from '@angular/core/testing';
import { ListService } from './list.service';
import { ListsFacade } from './lists.facade.service';

describe('ListsFacade', () => {
  let facade: ListsFacade;
  let listService: {
    getAllLists: ReturnType<typeof vi.fn>;
    createList: ReturnType<typeof vi.fn>;
    addCharacterToList: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    listService = {
      getAllLists: vi.fn(),
      createList: vi.fn(),
      addCharacterToList: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        ListsFacade,
        { provide: ListService, useValue: listService },
      ],
    });

    facade = TestBed.inject(ListsFacade);
  });

  it('loads and filters lists', async () => {
    const lists = [
      { listId: '1', name: 'Basic kanji', type: 'kanji', characters: [] },
      { listId: '2', name: 'Hiragana', type: 'hiragana', characters: [] },
    ];
    listService.getAllLists.mockResolvedValue(lists);

    await facade.loadLists();
    facade.filterLists('basic', 'kanji');

    expect(facade.filteredLists()).toEqual([lists[0]]);
    expect(facade.isLoading()).toBe(false);
    expect(facade.loadError()).toBeNull();
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
});
