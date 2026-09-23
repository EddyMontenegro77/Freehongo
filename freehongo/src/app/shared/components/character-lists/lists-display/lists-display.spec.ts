import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListsDisplay } from './lists-display';

describe('ListsDisplay', () => {
  let component: ListsDisplay;
  let fixture: ComponentFixture<ListsDisplay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListsDisplay]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListsDisplay);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
