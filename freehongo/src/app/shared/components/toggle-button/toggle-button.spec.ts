import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToggleButton } from './toggle-button';

describe('ToggleButton', () => {
  let fixture: ComponentFixture<ToggleButton>;
  let component: ToggleButton;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToggleButton],
    }).compileComponents();

    fixture = TestBed.createComponent(ToggleButton);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('label', 'Kana only');
    fixture.componentRef.setInput('checked', false);
    fixture.detectChanges();
  });

  it('should render the label and current state', () => {
    expect(fixture.nativeElement.textContent).toContain('Kana only');
    expect(fixture.nativeElement.textContent).toContain('Off');
  });

  it('should emit the toggled state when clicked', () => {
    const spy = vi.spyOn(component.checkedChange, 'emit');
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    button.click();

    expect(spy).toHaveBeenCalledWith(true);
  });
});
