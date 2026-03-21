import { ComponentFixture, TestBed } from '@angular/core/testing';

import { List } from './list';

describe('List', () => {
  let component: List;
  let fixture: ComponentFixture<List>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [List],
    }).compileComponents();

    fixture = TestBed.createComponent(List);
    fixture.componentRef.setInput('items', ['One', 'Two', 'Three']);
    fixture.detectChanges();
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render an unordered list by default', () => {
    const ul = fixture.nativeElement.querySelector('ul');
    const ol = fixture.nativeElement.querySelector('ol');

    expect(ul).toBeTruthy();
    expect(ol).toBeNull();
    expect(ul.querySelectorAll('li')).toHaveLength(3);
    expect(ul.textContent).toContain('One');
    expect(ul.textContent).toContain('Two');
    expect(ul.textContent).toContain('Three');
  });

  it('should render an ordered list when listType is ol', async () => {
    fixture.componentRef.setInput('listType', 'ol');
    fixture.detectChanges();
    await fixture.whenStable();

    const ul = fixture.nativeElement.querySelector('ul');
    const ol = fixture.nativeElement.querySelector('ol');

    expect(ul).toBeNull();
    expect(ol).toBeTruthy();
    expect(ol.querySelectorAll('li')).toHaveLength(3);
  });
});
