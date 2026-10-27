import { Component, input, signal, ChangeDetectionStrategy } from '@angular/core';

type ButtonVariant = 'primary' | 'secondary' | 'light' | 'accent' | 'danger' | 'success';

@Component({
  selector: 'app-action-btn',
  standalone: true,
  imports: [],
  templateUrl: './action-btn.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './action-btn.scss',
})
export class ActionBtn {
  title = input.required<string>();
  action = input.required<() => void | Promise<void>>();
  variant = input<ButtonVariant>('light');
  disabled = input<boolean>(false);
  busy = signal<boolean>(false);

  async handleClick(): Promise<void> {
    if (this.disabled() || this.busy()) return;

    this.busy.set(true);
    try {
      await this.action()();
    } finally {
      this.busy.set(false);
    }
  }
}
