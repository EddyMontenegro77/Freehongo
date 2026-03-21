import { Component, output, input, signal } from '@angular/core';

@Component({
  selector: 'app-action-btn',
  imports: [],
  templateUrl: './action-btn.html',
  styleUrl: './action-btn.scss',
})
export class ActionBtn {
  title = input.required<string>();
  action = input.required<() => void | Promise<void>>();
  disabled = input<boolean>(false);
  busy = signal<boolean>(false);
  isLoading = input<boolean>(false);

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
