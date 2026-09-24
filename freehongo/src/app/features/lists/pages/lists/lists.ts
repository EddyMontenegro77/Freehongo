import { Component } from '@angular/core';
import { ListsDisplay } from '../../../../shared/components/character-lists/lists-display/lists-display';

@Component({
  selector: 'app-lists',
  imports: [ListsDisplay],
  templateUrl: './lists.html',
  styleUrl: './lists.scss',
})
export class Lists {}
