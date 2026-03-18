import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IconBtn } from './icon-btn';

describe('IconBtn', () => {
  let component: IconBtn;
  let fixture: ComponentFixture<IconBtn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconBtn],
    }).compileComponents();

    fixture = TestBed.createComponent(IconBtn);
    fixture.componentRef.setInput('title', 'Click me');
    fixture.componentRef.setInput('iconSrc', 'favicon.ico');
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

  it('should have the icon source: "my_icon.svg"', () => {
    fixture.componentRef.setInput('iconSrc', 'my_icon.svg');
    fixture.detectChanges();

    expect(fixture.componentInstance.iconSrc()).toBe('my_icon.svg');
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
