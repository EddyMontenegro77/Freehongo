import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { Lists } from './lists';
import { ListsFacade } from '../../services/lists.facade.service';

describe('Lists', () => {
  let component: Lists;
  let fixture: ComponentFixture<Lists>;
  const listsFacadeMock = {
    lists: signal([]),
    filteredLists: signal([]),
    isLoading: signal(false),
    loadError: signal<string | null>(null),
    loadLists: vi.fn().mockResolvedValue(undefined),
    filterLists: vi.fn(),
    createList: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Lists],
      providers: [{ provide: ListsFacade, useValue: listsFacadeMock }],
    })
    .compileComponents();

    fixture = TestBed.createComponent(Lists);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the reusable lists display in manage mode', () => {
    const display = fixture.nativeElement.querySelector('app-lists-display');

    expect(display).toBeTruthy();
    expect(display.getAttribute('mode')).toBe('manage');
  });
});
