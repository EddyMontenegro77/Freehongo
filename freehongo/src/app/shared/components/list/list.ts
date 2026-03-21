import { Component, input } from '@angular/core';

export type ListType = 'ul' | 'ol';
export type ListItem = string | number;

@Component({
  selector: 'app-list',
  imports: [],
  templateUrl: './list.html',
  styleUrl: './list.scss',
})
export class List {
  items = input.required<ReadonlyArray<ListItem>>();
  listType = input<ListType>('ul');
  ariaLabel = input<string>('List');
}
