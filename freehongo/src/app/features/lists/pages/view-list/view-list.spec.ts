import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { CharacterList } from '../../../../shared/models/lists/list.model';
import { ListsFacade } from '../../services/lists.facade.service';
import { ViewList } from './view-list';

function makeList(overrides: Partial<CharacterList> = {}): CharacterList {
  return {
    listId: 'list-1',
    name: 'Kana basics',
    isPublic: false,
    type: 'hiragana',
    characters: ['3042'],
    createdAt: '2026-10-16T10:00:00.000Z',
    updatedAt: '2026-10-16T10:00:00.000Z',
    syncStatus: 'synced',
    ...overrides,
  };
}

describe('ViewList', () => {
  let component: ViewList;
  let fixture: ComponentFixture<ViewList>;
  let listsFacade: {
    getListById: ReturnType<typeof vi.fn>;
    updateList: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    listsFacade = {
      getListById: vi.fn(),
      updateList: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [ViewList],
      providers: [
        { provide: ListsFacade, useValue: listsFacade },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ id: 'list-1' }) },
          },
        },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewList);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function loadList(list: CharacterList | undefined): Promise<void> {
    listsFacade.getListById.mockResolvedValue(list);

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('loads and displays the list', async () => {
    await loadList(makeList());

    expect(fixture.nativeElement.textContent).toContain('Kana basics');
    expect(fixture.nativeElement.textContent).toContain('あ');
    expect(fixture.nativeElement.querySelector('app-icon-btn')).toBeTruthy();
  });

  it('shows an error when the list does not exist', async () => {
    await loadList(undefined);

    expect(component.loadError()).toBe('List not found.');
    expect(fixture.nativeElement.querySelector('app-error-state')).toBeTruthy();
  });

  it('shows edit controls and saves changes through the facade', async () => {
    await loadList(makeList());

    component.enterEditMode();
    component.updateName('Updated kana');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('app-input').length).toBe(1);
    expect(fixture.nativeElement.querySelector('app-select')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-toggle-button')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Save');
    expect(fixture.nativeElement.textContent).toContain('Cancel');

    await component.saveChanges();

    expect(listsFacade.updateList).toHaveBeenCalledWith('list-1', {
      name: 'Updated kana',
      type: 'hiragana',
      isPublic: false,
      characters: ['3042'],
    });
    expect(component.editMode).toBe(false);
  });

  it('trims the name before saving', async () => {
    await loadList(makeList());

    component.enterEditMode();
    component.updateName('  Spaced name  ');
    await component.saveChanges();

    expect(listsFacade.updateList).toHaveBeenCalledWith(
      'list-1',
      expect.objectContaining({ name: 'Spaced name' }),
    );
    expect(component.originalList()?.name).toBe('Spaced name');
  });

  it('saves the public flag and marks the saved list as pending sync', async () => {
    await loadList(makeList({ isPublic: false, syncStatus: 'synced' }));

    component.enterEditMode();
    component.updatePublic(true);
    await component.saveChanges();

    expect(listsFacade.updateList).toHaveBeenCalledWith(
      'list-1',
      expect.objectContaining({ isPublic: true }),
    );
    expect(component.originalList()?.isPublic).toBe(true);
    expect(component.originalList()?.syncStatus).toBe('pending');
  });

  it('removes a character only after it is confirmed', async () => {
    await loadList(makeList({ characters: ['3042', '3044'] }));

    component.enterEditMode();
    component.requestRemoveCharacter('3042');

    expect(component.pendingCharacter()).toBe('3042');
    expect(component.modifiedList()?.characters).toEqual(['3042', '3044']);

    component.removeCharacterFromList();

    expect(component.modifiedList()?.characters).toEqual(['3044']);
    expect(component.originalList()?.characters).toEqual(['3042', '3044']);
    expect(component.pendingCharacter()).toBeNull();
  });

  it('cancels changes and restores the original list', async () => {
    await loadList(makeList({ isPublic: false }));

    component.enterEditMode();
    component.updateName('Temporary name');
    component.updatePublic(true);
    component.cancelChanges();

    expect(component.modifiedList()?.name).toBe('Kana basics');
    expect(component.modifiedList()?.isPublic).toBe(false);
    expect(component.editMode).toBe(false);
  });

  it('keeps the edit mode and shows an error when saving fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    listsFacade.updateList.mockRejectedValue(new Error('db unavailable'));
    await loadList(makeList());

    component.enterEditMode();
    component.updateName('Updated kana');
    await component.saveChanges();

    expect(component.saveError()).toBe('Could not save changes.');
    expect(component.editMode).toBe(true);
    expect(component.isSaving()).toBe(false);
  });
});
