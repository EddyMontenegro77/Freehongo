import { Component, input, ChangeDetectionStrategy, booleanAttribute } from '@angular/core';

type CardVariant = 'outline' | 'elevated';
type CardSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-card',
  standalone: true,
  templateUrl: './card.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './card.scss',
})
export class Card {
  variant = input<CardVariant>('outline');
  size = input<CardSize>('md');
  transparent = input<boolean>(false);
  hoverable = input(false, { transform: booleanAttribute });
}
