import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';

type InputType =
  | 'text'
  | 'password'
  | 'email'
  | 'number'
  | 'search'
  | 'tel'
  | 'url'
  | 'date'
  | 'time'
  | 'datetime-local';

@Component({
  selector: 'app-input',
  standalone: true,
  templateUrl: './input.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './input.scss',
})
export class InputField {
  label = input.required<string>();
  value = input<string | number>('');
  type = input<InputType>('text');
  placeholder = input<string>('');
  helperText = input<string>('');
  errorText = input<string>('');
  disabled = input<boolean>(false);
  required = input<boolean>(false);
  autocomplete = input<string>('');
  min = input<string | number | null>(null);
  max = input<string | number | null>(null);
  step = input<string | number | null>(null);

  valueChange = output<string>();

  onInput = (event: Event): void => {
    this.valueChange.emit((event.target as HTMLInputElement).value);
  };
}
