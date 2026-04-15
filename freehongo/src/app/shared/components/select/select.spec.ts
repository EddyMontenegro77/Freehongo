import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectField } from './select';

describe('SelectField', () => {
  let fixture: ComponentFixture<any>;
  let component: SelectField;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectField],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectField);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('label', 'Character type');
    fixture.componentRef.setInput('value', 'kana');
    fixture.componentRef.setInput('placeholder', 'Choose one');
    fixture.componentRef.setInput('options', [
      { label: 'Kana', value: 'kana' },
      { label: 'Kanji', value: 'kanji' },
    ]);
    fixture.detectChanges();
  });

  it('should render the label and options', () => {
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    expect(fixture.nativeElement.textContent).toContain('Character type');
    expect(select.options.length).toBe(3);
    expect(select.value).toBe('kana');
  });

  it('should emit value changes', () => {
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    const spy = vi.spyOn(component.valueChange, 'emit');

    select.value = 'kanji';
    select.dispatchEvent(new Event('change'));

    expect(spy).toHaveBeenCalledWith('kanji');
  });
});
