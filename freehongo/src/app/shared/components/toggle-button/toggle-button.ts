import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-toggle-button',
  standalone: true,
  templateUrl: './toggle-button.html',
  styleUrl: './toggle-button.scss',
})
export class ToggleButton {
  label = input.required<string>();
  checked = input<boolean>(false);
  onLabel = input<string>('On');
  offLabel = input<string>('Off');
  disabled = input<boolean>(false);

  checkedChange = output<boolean>();

  toggle = (): void => {
    if (this.disabled()) {
      return;
    }

    this.checkedChange.emit(!this.checked());
  };
}
