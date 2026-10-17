import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { ListsDisplay } from './lists-display';
import { ListsFacade } from '../../../../features/lists/services/lists.facade.service';

describe('ListsDisplay', () => {
  let component: ListsDisplay;
  let fixture: ComponentFixture<ListsDisplay>;
  let listsFacadeMock: any;

  beforeEach(async () => {
    listsFacadeMock = {
      lists: signal([]),
      filteredLists: signal([]),
      isLoading: signal(false),
      loadError: signal<string | null>(null),
      loadLists: vi.fn().mockResolvedValue(undefined),
      filterLists: vi.fn(),
      createList: vi.fn(),
      deleteList: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [ListsDisplay],
      providers: [{ provide: ListsFacade, useValue: listsFacadeMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(ListsDisplay);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('renders list data and emits the selected list id', () => {
    listsFacadeMock.filteredLists.set([
      {
        listId: 'list-1',
        name: 'Basic kana',
        type: 'hiragana',
        characters: ['3042'],
      },
    ]);
    fixture.componentRef.setInput('mode', 'select');

    const selected = vi.fn();
    component.listSelected.subscribe(selected);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Basic kana');
    expect(fixture.nativeElement.textContent).toContain('あ');

    const button = fixture.nativeElement.querySelector(
      '.list-display app-icon-btn button',
    ) as HTMLButtonElement;
    button.click();

    expect(selected).toHaveBeenCalledWith('list-1');
  });

  it('emits the selected list id in quiz mode', () => {
    listsFacadeMock.filteredLists.set([
      {
        listId: 'list-1',
        name: 'Basic kana',
        type: 'hiragana',
        characters: ['3042'],
      },
    ]);
    fixture.componentRef.setInput('mode', 'quiz');

    const selected = vi.fn();
    component.quizSelected.subscribe(selected);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector(
      '.list-display app-action-btn button',
    ) as HTMLButtonElement;
    button.click();

    expect(selected).toHaveBeenCalledWith('list-1');
    expect(fixture.nativeElement.querySelector('app-navigation-btn')).toBeNull();
  });

  it('uses the compact layout only when requested', () => {
    expect(fixture.nativeElement.querySelector('.lists-container--compact')).toBeNull();

    fixture.componentRef.setInput('compact', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.lists-container--compact')).toBeTruthy();
  });

  it('scrolls to the create form when opening it in compact mode', () => {
    fixture.componentRef.setInput('compact', true);
    const scrollIntoView = vi.fn();
    (component as any).createForm = { nativeElement: { scrollIntoView } };
    vi.useFakeTimers();

    component.toggleCreatingList();
    vi.runAllTimers();
    vi.useRealTimers();

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'center',
    });
  });

  it('emits the new list id after creating a list in select mode', async () => {
    fixture.componentRef.setInput('mode', 'select');
    listsFacadeMock.createList.mockResolvedValue('new-list');

    const created = vi.fn();
    component.listCreated.subscribe(created);
    component.newListName.setValue('My kana');

    await component.createList();

    expect(listsFacadeMock.createList).toHaveBeenCalledWith({
      name: 'My kana',
      type: 'mixed',
      characters: [],
    });
    expect(created).toHaveBeenCalledWith('new-list');
  });

  it('limits the character preview and shows the remaining count', () => {
    listsFacadeMock.filteredLists.set([
      {
        listId: 'list-1',
        name: 'Large list',
        type: 'mixed',
        characters: ['3042', '3044', '3046', '3048', '304A', '304B', '304D'],
      },
    ]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.more-characters').textContent).toContain('+2 more');
  });

  it('deletes a list only after the confirmation action', async () => {
    listsFacadeMock.filteredLists.set([
      {
        listId: 'list-1',
        name: 'To delete',
        type: 'mixed',
        characters: [],
      },
    ]);
    fixture.detectChanges();

    component.requestDeleteList('list-1');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-confirmation')).toBeTruthy();
    expect(listsFacadeMock.deleteList).not.toHaveBeenCalled();

    await component.deleteList();

    expect(listsFacadeMock.deleteList).toHaveBeenCalledWith('list-1');
  });
});
