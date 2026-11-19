import { Component, input, ChangeDetectionStrategy } from '@angular/core';

export type ListType = 'ul' | 'ol';
export type ListItem = string | number;
export type ListMarker =
  | 'disc'
  | 'circle'
  | 'square'
  | 'decimal'
  | 'lower-alpha'
  | 'upper-alpha'
  | 'lower-roman'
  | 'upper-roman'
  | 'none';

@Component({
  selector: 'app-list',
  imports: [],
  standalone: true,
  templateUrl: './list.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './list.scss',
})
export class List {
  items = input.required<ReadonlyArray<ListItem>>();
  listType = input<ListType>('ul');
  marker = input<ListMarker>('disc');
  ariaLabel = input<string>('List');
}
