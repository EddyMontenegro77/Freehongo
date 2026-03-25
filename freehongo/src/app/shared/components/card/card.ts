import { Component, input } from '@angular/core';

type CardVariant = 'outline' | 'elevated';
type CardSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-card',
  standalone: true,
  templateUrl: './card.html',
  styleUrl: './card.scss',
})
export class Card {
  variant = input<CardVariant>('outline');
  size = input<CardSize>('md');
}
