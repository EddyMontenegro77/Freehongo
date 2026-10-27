import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-chip',
  standalone: true,
  templateUrl: './chip.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './chip.scss',
})
export class Chip {}
