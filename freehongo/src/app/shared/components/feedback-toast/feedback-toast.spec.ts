import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeedbackToast } from './feedback-toast';

describe('FeedbackToast', () => {
  let component: FeedbackToast;
  let fixture: ComponentFixture<FeedbackToast>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeedbackToast],
    }).compileComponents();

    fixture = TestBed.createComponent(FeedbackToast);
    component = fixture.componentInstance;
  });

  it('shows a message and hides it after the configured duration', () => {
    vi.useFakeTimers();

    component.show('Character added', 1000);
    fixture.detectChanges();
    expect(component.visible()).toBe(true);
    expect(component.message()).toBe('Character added');
    expect(fixture.nativeElement.querySelector('.feedback-toast').textContent).toContain(
      'Character added',
    );

    vi.advanceTimersByTime(1000);
    fixture.detectChanges();
    expect(component.visible()).toBe(false);
    expect(fixture.nativeElement.querySelector('.feedback-toast')).toBeNull();

    vi.useRealTimers();
  });
});
