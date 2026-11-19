import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  OnDestroy,
  signal,
} from '@angular/core';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'dark'
  | 'light'
  | 'accent'
  | 'danger'
  | 'success';
export type ButtonType = 'button' | 'submit';

@Component({
  selector: 'app-action-btn',
  standalone: true,
  imports: [],
  templateUrl: './action-btn.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './action-btn.scss',
})
export class ActionBtn implements OnDestroy {
  title = input.required<string>();
  action = input<() => void | Promise<void>>();
  variant = input<ButtonVariant>('light');
  type = input<ButtonType>('button');
  disabled = input<boolean>(false);
  busyTitle = input<string>('');
  cooldownSeconds = input<number>(0);
  cooldownLabel = input<string>('Retry in');
  busy = signal<boolean>(false);
  cooldownRemaining = signal(0);
  displayTitle = computed(() => {
    if (this.busy() && this.busyTitle()) return this.busyTitle();
    if (this.cooldownRemaining() > 0) {
      return `${this.cooldownLabel()} ${this.cooldownRemaining()}s`;
    }
    return this.title();
  });
  private cooldownTimer?: ReturnType<typeof setInterval>;

  async handleClick(): Promise<void> {
    const action = this.action();
    if (!action || this.disabled() || this.busy() || this.cooldownRemaining() > 0) return;

    this.busy.set(true);
    let completed = false;
    try {
      await action();
      completed = true;
    } finally {
      this.busy.set(false);
    }
    if (completed && this.cooldownSeconds() > 0) this.startCooldown();
  }

  ngOnDestroy(): void {
    this.stopCooldown();
  }

  private startCooldown(): void {
    this.stopCooldown();
    this.cooldownRemaining.set(this.cooldownSeconds());
    this.cooldownTimer = setInterval(() => {
      const remaining = this.cooldownRemaining() - 1;
      if (remaining <= 0) {
        this.stopCooldown();
        return;
      }
      this.cooldownRemaining.set(remaining);
    }, 1000);
  }

  private stopCooldown(): void {
    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
      this.cooldownTimer = undefined;
    }
    this.cooldownRemaining.set(0);
  }
}
