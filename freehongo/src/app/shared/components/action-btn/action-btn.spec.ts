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

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have title the title: "submit"', () => {
    fixture.componentRef.setInput('title', 'submit');
    fixture.detectChanges();

    expect(fixture.componentInstance.title()).toBe('submit');
    expect(fixture.nativeElement.querySelector('button').textContent.trim()).toBe('submit');
  });

  it('should call action when button is clicked', () => {
    const mockAction = vi.fn();

    fixture.componentRef.setInput('action', mockAction);
    fixture.detectChanges();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    button.click();

    expect(mockAction).toHaveBeenCalledOnce();
  });

  it('should render the configured variant and button type', () => {
    fixture.componentRef.setInput('variant', 'primary');
    fixture.componentRef.setInput('type', 'submit');
    fixture.detectChanges();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');

    expect(button.className).toBe('primary');
    expect(button.type).toBe('submit');
  });

  it('should not call action when disabled', async () => {
    const mockAction = vi.fn();
    fixture.componentRef.setInput('action', mockAction);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    button.click();
    await fixture.whenStable();

    expect(button.disabled).toBe(true);
    expect(button.classList).toContain('disabled');
    expect(mockAction).not.toHaveBeenCalled();
  });

  it('should show the busy title and prevent concurrent actions', async () => {
    let resolveAction!: () => void;
    const action = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveAction = resolve;
        }),
    );
    fixture.componentRef.setInput('action', action);
    fixture.componentRef.setInput('busyTitle', 'Saving...');
    fixture.detectChanges();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    const pendingAction = component.handleClick();
    fixture.detectChanges();

    expect(component.busy()).toBe(true);
    expect(button.disabled).toBe(true);
    expect(button.textContent.trim()).toBe('Saving...');

    await component.handleClick();
    expect(action).toHaveBeenCalledOnce();

    resolveAction();
    await pendingAction;
    expect(component.busy()).toBe(false);
  });

  it('should start and finish a cooldown after a successful action', async () => {
    vi.useFakeTimers();
    fixture.componentRef.setInput('action', vi.fn());
    fixture.componentRef.setInput('cooldownSeconds', 2);
    fixture.componentRef.setInput('cooldownLabel', 'Retry in');
    fixture.detectChanges();

    await component.handleClick();
    fixture.detectChanges();
    expect(component.cooldownRemaining()).toBe(2);
    expect(fixture.nativeElement.querySelector('button').textContent.trim()).toBe('Retry in 2s');

    vi.advanceTimersByTime(1000);
    expect(component.cooldownRemaining()).toBe(1);
    vi.advanceTimersByTime(1000);
    expect(component.cooldownRemaining()).toBe(0);
  });

  it('should not start a cooldown when the action fails', async () => {
    const error = new Error('failed');
    fixture.componentRef.setInput('action', vi.fn().mockRejectedValue(error));
    fixture.componentRef.setInput('cooldownSeconds', 2);

    await expect(component.handleClick()).rejects.toThrow('failed');

    expect(component.busy()).toBe(false);
    expect(component.cooldownRemaining()).toBe(0);
  });
});
