import { Component, OnDestroy, input, signal } from '@angular/core';

@Component({
  selector: 'app-feedback-toast',
  standalone: true,
  imports: [],
  templateUrl: './feedback-toast.html',
  styleUrl: './feedback-toast.scss',
})
export class FeedbackToast implements OnDestroy {
  duration = input(1000);
  message = signal('');
  visible = signal(false);
  visibleDuration = signal(1000);

  private timeoutId?: ReturnType<typeof setTimeout>;

  show(message: string, duration = this.duration()): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.message.set(message);
    this.visibleDuration.set(duration);
    this.visible.set(true);
    this.timeoutId = setTimeout(() => {
      this.visible.set(false);
      this.timeoutId = undefined;
    }, duration);
  }

  ngOnDestroy(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }
}
