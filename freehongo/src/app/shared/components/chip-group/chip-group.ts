import { Component, input } from '@angular/core';

@Component({
  selector: 'app-chip-group',
  standalone: true,
  templateUrl: './chip-group.html',
  styleUrl: './chip-group.scss',
})
export class ChipGroup {
  title = input.required<string>();
  layout = input<'wrap' | 'stack'>('wrap');
}
