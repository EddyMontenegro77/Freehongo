import { Component, signal } from '@angular/core';
import { input } from '@angular/core';

@Component({
  selector: 'app-icon-btn',
  imports: [],
  templateUrl: './icon-btn.html',
  styleUrl: './icon-btn.scss',
})
export class IconBtn {
  title = input.required<string>();
  action = input.required<() => void | Promise<void>>();
  iconSrc = input.required<string>();
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
