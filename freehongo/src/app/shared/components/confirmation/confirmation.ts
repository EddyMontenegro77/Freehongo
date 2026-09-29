import { Component, input } from '@angular/core';
import { ActionBtn } from '../action-btn/action-btn';

@Component({
  selector: 'app-confirmation',
  standalone: true,
  imports: [ActionBtn],
  templateUrl: './confirmation.html',
  styleUrl: './confirmation.scss',
})
export class Confirmation {
  open = input(false);
  title = input.required<string>();
  message = input.required<string>();
  confirmText = input('Confirm');
  cancelText = input('Cancel');
  confirmAction = input.required<() => void | Promise<void>>();
  cancelAction = input.required<() => void | Promise<void>>();
}
