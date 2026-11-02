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

  it('should update its model on input', () => {
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    input.value = 'updated';
    input.dispatchEvent(new Event('input'));

    expect(component.value()).toBe('updated');
  });

  it('should render the configured input attributes', () => {
    fixture.componentRef.setInput('type', 'number');
    fixture.componentRef.setInput('required', true);
    fixture.componentRef.setInput('autocomplete', 'off');
    fixture.componentRef.setInput('min', 1);
    fixture.componentRef.setInput('max', 10);
    fixture.componentRef.setInput('step', 0.5);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(input.type).toBe('number');
    expect(input.required).toBe(true);
    expect(input.autocomplete).toBe('off');
    expect(input.min).toBe('1');
    expect(input.max).toBe('10');
    expect(input.step).toBe('0.5');
    expect(fixture.nativeElement.querySelector('.field__required')).toBeTruthy();
  });

  it('should render helper text when provided', () => {
    fixture.componentRef.setInput('helperText', 'Use your username');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.field__helper').textContent.trim()).toBe(
      'Use your username',
    );
  });

  it('should render the explicit error text', () => {
    fixture.componentRef.setInput('errorText', 'Invalid username');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.field__error').textContent.trim()).toBe(
      'Invalid username',
    );
  });

  it('should render the first validation error only after the field is touched', () => {
    fixture.componentRef.setInput('errors', [{ message: 'Required field' }]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.field__error')).toBeNull();

    fixture.componentRef.setInput('touched', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.field__error').textContent.trim()).toBe(
      'Required field',
    );
  });

  it('should prioritize explicit error text over validation errors', () => {
    fixture.componentRef.setInput('touched', true);
    fixture.componentRef.setInput('errors', [{ message: 'Required field' }]);
    fixture.componentRef.setInput('errorText', 'Invalid value');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.field__error').textContent.trim()).toBe(
      'Invalid value',
    );
  });

  it('should disable the input and apply the disabled class', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const field = fixture.nativeElement.querySelector('.field') as HTMLElement;

    expect(input.disabled).toBe(true);
    expect(field.classList.contains('field--disabled')).toBe(true);
  });

  it('should emit touch when the input loses focus', () => {
    const touch = vi.fn();
    component.touch.subscribe(touch);
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    input.dispatchEvent(new Event('blur'));

    expect(touch).toHaveBeenCalledOnce();
  });
});
