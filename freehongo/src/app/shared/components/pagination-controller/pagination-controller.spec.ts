import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaginationController } from './pagination-controller';

describe('PaginationController', () => {
  let component: PaginationController;
  let fixture: ComponentFixture<PaginationController>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginationController]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaginationController);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should emit next and previous page changes', () => {
    fixture.componentRef.setInput('currentPage', 3);
    fixture.componentRef.setInput('totalPages', 10);
    fixture.detectChanges();

    const emitSpy = vi.spyOn(component.pageChange, 'emit');

    component.previousPage();
    expect(emitSpy).toHaveBeenCalledWith(2);

    component.nextPage();
    expect(emitSpy).toHaveBeenCalledWith(4);
  });
});
