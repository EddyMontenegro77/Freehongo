import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';

export type SegmentedOption<T = string> = {
  label: string;
  value: T;
  disabled?: boolean;
};

@Component({
  selector: 'app-segmented-control',
  standalone: true,
  templateUrl: './segmented-control.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './segmented-control.scss',
})
export class SegmentedControl<T = string> {
  label = input.required<string>();
  value = input<T>();
  options = input.required<ReadonlyArray<SegmentedOption<T>>>();
  disabled = input<boolean>(false);
  wrap = input<boolean>(false);

  valueChange = output<T>();

  selectOption = (option: SegmentedOption<T>): void => {
    if (this.disabled() || option.disabled) {
      return;
    }

    this.valueChange.emit(option.value);
  };
}
