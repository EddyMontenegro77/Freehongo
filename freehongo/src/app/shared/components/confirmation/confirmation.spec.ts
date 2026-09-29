import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Confirmation } from './confirmation';

describe('Confirmation', () => {
  let fixture: ComponentFixture<Confirmation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Confirmation],
    }).compileComponents();

    fixture = TestBed.createComponent(Confirmation);
    fixture.componentRef.setInput('title', 'Remove character');
    fixture.componentRef.setInput('message', 'Are you sure?');
    fixture.componentRef.setInput('confirmAction', vi.fn());
    fixture.componentRef.setInput('cancelAction', vi.fn());
  });

  it('does not render when closed', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alertdialog"]')).toBeNull();
  });

  it('renders the message and actions when open', () => {
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Remove character');
    expect(fixture.nativeElement.textContent).toContain('Are you sure?');
    expect(fixture.nativeElement.textContent).toContain('Confirm');
    expect(fixture.nativeElement.textContent).toContain('Cancel');
  });
});
