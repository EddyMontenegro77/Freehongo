import { Component, input, output } from '@angular/core';

export type SelectOption<T = string> = {
  label: string;
  value: T;
  disabled?: boolean;
};

@Component({
  selector: 'app-select',
  standalone: true,
  templateUrl: './select.html',
  styleUrl: './select.scss',
})
export class SelectField<T = string> {
  label = input.required<string>();
  value = input<T>();
  options = input.required<ReadonlyArray<SelectOption>>();
  placeholder = input<string>('');
  helperText = input<string>('');
  errorText = input<string>('');
  disabled = input<boolean>(false);
  required = input<boolean>(false);

  valueChange = output<T>();

  onChange = (event: Event): void => {
    const value = (event.target as HTMLSelectElement).value as T;
    this.valueChange.emit(value);
  };
}
