import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { ActionBtn, ButtonVariant } from '../action-btn/action-btn';

@Component({
  selector: 'app-confirmation',
  standalone: true,
  imports: [ActionBtn],
  templateUrl: './confirmation.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './confirmation.scss',
})
export class Confirmation {
  open = input(false);
  title = input.required<string>();
  message = input.required<string>();

  confirmText = input('Confirm');
  cancelText = input('Cancel');

  confirmVariant = input<ButtonVariant>('success');
  cancelVariant = input<ButtonVariant>('danger');

  confirmAction = input.required<() => void | Promise<void>>();
  cancelAction = input.required<() => void | Promise<void>>();
}
