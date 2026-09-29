import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { ListsFacade } from '../../services/lists.facade.service';
import { ViewList } from './view-list';

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
      updateList: vi.fn(),
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
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewList);
    component = fixture.componentInstance;
  });

  it('loads and displays the list', async () => {
    listsFacade.getListById.mockResolvedValue({
      listId: 'list-1',
      name: 'Kana basics',
      type: 'hiragana',
      characters: ['3042'],
    });

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Kana basics');
    expect(fixture.nativeElement.textContent).toContain('あ');
    expect(fixture.nativeElement.querySelector('app-action-btn')).toBeTruthy();
  });

  it('shows edit controls and saves changes through the facade', async () => {
    listsFacade.getListById.mockResolvedValue({
      listId: 'list-1',
      name: 'Kana basics',
      type: 'hiragana',
      characters: ['3042'],
    });
    listsFacade.updateList.mockResolvedValue(undefined);

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    component.enterEditMode();
    component.updateName('Updated kana');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('app-input').length).toBe(1);
    expect(fixture.nativeElement.querySelector('app-select')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Save');
    expect(fixture.nativeElement.textContent).toContain('Cancel');

    await component.saveChanges();

    expect(listsFacade.updateList).toHaveBeenCalledWith('list-1', {
      name: 'Updated kana',
      type: 'hiragana',
      characters: ['3042'],
    });
    expect(component.editMode).toBe(false);
  });

  it('cancels changes and restores the original list', async () => {
    listsFacade.getListById.mockResolvedValue({
      listId: 'list-1',
      name: 'Kana basics',
      type: 'hiragana',
      characters: ['3042'],
    });

    fixture.detectChanges();
    await fixture.whenStable();

    component.enterEditMode();
    component.updateName('Temporary name');
    component.cancelChanges();

    expect(component.modifiedList()?.name).toBe('Kana basics');
    expect(component.editMode).toBe(false);
  });
});
