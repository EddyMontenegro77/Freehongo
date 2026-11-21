import { Component, ChangeDetectionStrategy, input } from '@angular/core';

export type ChipVariant = 'default' | 'success' | 'danger';

@Component({
  selector: 'app-chip',
  standalone: true,
  templateUrl: './chip.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './chip.scss',
})
export class Chip {
  variant = input<ChipVariant>('default');
}
