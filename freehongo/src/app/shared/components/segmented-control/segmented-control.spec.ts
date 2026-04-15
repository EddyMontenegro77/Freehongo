import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SegmentedControl } from './segmented-control';

describe('SegmentedControl', () => {
  let fixture: ComponentFixture<any>;
  let component: SegmentedControl<string>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SegmentedControl],
    }).compileComponents();

    fixture = TestBed.createComponent(SegmentedControl);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('label', 'Character type');
    fixture.componentRef.setInput('value', 'kana');
    fixture.componentRef.setInput('options', [
      { label: 'Kana', value: 'kana' },
      { label: 'Kanji', value: 'kanji' },
    ]);
    fixture.detectChanges();
  });

  it('should render the label and the options', () => {
    expect(fixture.nativeElement.textContent).toContain('Character type');
    expect(fixture.nativeElement.textContent).toContain('Kana');
    expect(fixture.nativeElement.textContent).toContain('Kanji');
  });

  it('should emit the selected value when an option is clicked', () => {
    const spy = vi.spyOn(component.valueChange, 'emit');
    const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;

    buttons[1].click();

    expect(spy).toHaveBeenCalledWith('kanji');
  });
});
