import { Component, input, signal, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-demo-block',
  standalone: true,
  templateUrl: './demo-block.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './demo-block.scss',
})
export class DemoBlock {
  heading = input.required<string>();
  description = input<string>('');
  code = input<string>('');

  copied = signal(false);
  private timeoutId?: ReturnType<typeof setTimeout>;

  copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(this.code());
    } catch {
      return;
    }

    this.copied.set(true);
    clearTimeout(this.timeoutId);
    this.timeoutId = setTimeout(() => this.copied.set(false), 1500);
  };
}
