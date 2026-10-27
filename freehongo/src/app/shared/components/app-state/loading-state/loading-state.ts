import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-loading-state',
  imports: [],
  standalone: true,
  templateUrl: './loading-state.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './loading-state.scss',
})
export class LoadingState {
  message = input<string>('');
}
