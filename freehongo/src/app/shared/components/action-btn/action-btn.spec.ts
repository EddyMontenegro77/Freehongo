import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActionBtn } from './action-btn';

describe('ActionBtn', () => {
  let component: ActionBtn;
  let fixture: ComponentFixture<ActionBtn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActionBtn],
    }).compileComponents();

    fixture = TestBed.createComponent(ActionBtn);
    fixture.componentRef.setInput('title', 'Click me');
    fixture.componentRef.setInput('action', vi.fn());
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have title the title: "submit"', () => {
    fixture.componentRef.setInput('title', 'submit');
    fixture.detectChanges();

    expect(fixture.componentInstance.title()).toBe('submit');
  });

  it('should call action when button is clicked', () => {
    const mockAction = vi.fn();

    fixture.componentRef.setInput('action', mockAction);
    fixture.detectChanges();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    button.click();

    expect(mockAction).toHaveBeenCalledOnce();
  });
});
