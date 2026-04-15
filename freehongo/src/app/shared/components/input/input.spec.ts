import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InputField } from './input';

describe('InputField', () => {
  let fixture: ComponentFixture<InputField>;
  let component: InputField;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputField],
    }).compileComponents();

    fixture = TestBed.createComponent(InputField);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('label', 'Search');
    fixture.componentRef.setInput('value', 'initial');
    fixture.componentRef.setInput('placeholder', 'Type here');
    fixture.detectChanges();
  });

  it('should render the label and placeholder', () => {
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(fixture.nativeElement.textContent).toContain('Search');
    expect(input.placeholder).toBe('Type here');
    expect(input.value).toBe('initial');
  });

  it('should emit value changes', () => {
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const spy = vi.spyOn(component.valueChange, 'emit');

    input.value = 'updated';
    input.dispatchEvent(new Event('input'));

    expect(spy).toHaveBeenCalledWith('updated');
  });
});
