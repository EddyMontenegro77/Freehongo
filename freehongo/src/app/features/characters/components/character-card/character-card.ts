import { Component, input } from '@angular/core';
import { Card } from '../../../../shared/components/card/card';
import { ActionBtn } from '../../../../shared/components/action-btn/action-btn';
import { Router } from '@angular/router';
import { CharacterType } from '../../../../shared/models/japanese/character.type';

@Component({
  selector: 'app-character-card',
  imports: [Card, ActionBtn],
  standalone: true,
  templateUrl: './character-card.html',
  styleUrl: './character-card.scss',
})
export class CharacterCard {
  constructor(private router: Router) {}

  WRITING_PRACTICE_ROUTE = 'writing';
  CHARACTER_DETAILS_ROUTE = 'characters/info';

  literal = input.required<string>();
  unicode = input.required<string>();
  type = input.required<CharacterType>();

  openWritingPractice = (): void => {
    this.router.navigate([this.WRITING_PRACTICE_ROUTE, this.type(), this.unicode()]);
  };

  openCharacterDetails = (): void => {
    this.router.navigate([this.CHARACTER_DETAILS_ROUTE, this.type(), this.unicode()]);
  };
}
