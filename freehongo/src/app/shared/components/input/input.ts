import { Component, input, output, ChangeDetectionStrategy, model, computed } from '@angular/core';
import { FormValueControl, ValidationError } from '@angular/forms/signals';

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
  value = model<string>('');
  disabled = input<boolean>(false);
  required = input<boolean>(false);
  touched = input<boolean>(false);
  errors = input<readonly ValidationError.WithOptionalFieldTree[]>([]);
  touch = output<void>();

  label = input.required<string>();
  type = input<InputType>('text');
  placeholder = input<string>('');
  helperText = input<string>('');
  errorText = input<string>('');
  autocomplete = input<string>('');
  min = input<string | number | null | undefined>(null);
  max = input<string | number | null | undefined>(null);
  step = input<string | number | null | undefined>(null);

  protected displayError = computed(
    () => this.errorText() || (this.touched() ? (this.errors()[0]?.message ?? '') : ''),
  );

  onInput = (event: Event): void => {
    this.value.set((event.target as HTMLInputElement).value);
  };
}
