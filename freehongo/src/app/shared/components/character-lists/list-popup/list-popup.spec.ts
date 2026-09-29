import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { ListPopup } from './list-popup';
import { ListsFacade } from '../../../../features/lists/services/lists.facade.service';

describe('ListPopup', () => {
  let component: ListPopup;
  let fixture: ComponentFixture<ListPopup>;
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
      addCharacterToList: vi.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [ListPopup],
      providers: [{ provide: ListsFacade, useValue: listsFacadeMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(ListPopup);
    fixture.componentRef.setInput('unicode', '3042');
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('renders the list selector and feedback toast', () => {
    expect(fixture.nativeElement.querySelector('app-lists-display')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-feedback-toast')).toBeTruthy();
  });

  it('adds the character, closes the modal and shows feedback', async () => {
    const close = vi.spyOn(component.listPopupModal, 'close').mockImplementation(() => {});
    const show = vi.spyOn(component.feedbackToast, 'show').mockImplementation(() => {});

    await component.addCharacterToList('list-1');

    expect(listsFacadeMock.addCharacterToList).toHaveBeenCalledWith('list-1', '3042');
    expect(close).toHaveBeenCalledOnce();
    expect(show).toHaveBeenCalledWith('Character added to your list.');
  });
});
