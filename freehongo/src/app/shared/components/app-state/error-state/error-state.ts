import { Component, input } from '@angular/core';
import { ActionBtn } from '../../action-btn/action-btn';

@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [ActionBtn],
  templateUrl: './error-state.html',
  styleUrl: './error-state.scss',
})
export class ErrorState {
  title = input.required<string>();
  message = input.required<string>();
  actionTitle = input<string>('Retry');
  action = input<(() => void | Promise<void>) | null>(null);
}
