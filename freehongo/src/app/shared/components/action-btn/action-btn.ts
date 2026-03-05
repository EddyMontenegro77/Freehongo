import { Component, output, input } from '@angular/core';

@Component({
  selector: 'app-action-btn',
  imports: [],
  templateUrl: './action-btn.html',
  styleUrl: './action-btn.scss',
})
export class ActionBtn {
  title = input.required<string>();
  action = input.required<() => void>();
}
