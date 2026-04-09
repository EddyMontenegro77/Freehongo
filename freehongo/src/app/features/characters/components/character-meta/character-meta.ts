import { Component, input } from '@angular/core';
import { Router } from '@angular/router';
import { ActionBtn } from '../../../../shared/components/action-btn/action-btn';
import { Card } from '../../../../shared/components/card/card';
import { Chip } from '../../../../shared/components/chip/chip';
import { ChipGroup } from '../../../../shared/components/chip-group/chip-group';
import { Character } from '../../../../shared/models/japanese/character.model';

@Component({
  selector: 'app-character-meta',
  standalone: true,
  imports: [Card, ActionBtn, Chip, ChipGroup],
  templateUrl: './character-meta.html',
  styleUrl: './character-meta.scss',
})
export class CharacterMeta {
  private readonly practiceRoute = 'writing';

  character = input.required<Character>();

  constructor(private router: Router) {}

  entries<T>(value: Record<string, T>): Array<[string, T]> {
    return Object.entries(value) as Array<[string, T]>;
  }

  openPractice = (): void => {
    const current = this.character();
    this.router.navigate([this.practiceRoute, current.kind, current.unicode]);
  };
}
