import { Component, input } from '@angular/core';
import { WritingCanvas } from '../writing-canvas/writing-canvas';
import { CharacterType } from '../../../../shared/models/japanese/character.type';

@Component({
  selector: 'app-writing-practice',
  standalone: true,
  imports: [WritingCanvas],
  templateUrl: './writing-practice.html',
  styleUrl: './writing-practice.scss',
})
export class WritingPractice {
  width = input.required<number>();
  height = input.required<number>();
  unicode = input.required<string>();
  type = input.required<CharacterType>();
}
