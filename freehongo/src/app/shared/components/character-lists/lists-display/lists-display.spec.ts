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
});
