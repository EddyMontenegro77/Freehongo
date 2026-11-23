import { Component, input, inject, viewChild, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { ActionBtn } from '../../../../shared/components/action-btn/action-btn';
import { Card } from '../../../../shared/components/card/card';
import { Chip } from '../../../../shared/components/chip/chip';
import { ChipGroup } from '../../../../shared/components/chip-group/chip-group';
import { Character } from '../../../../shared/models/japanese/character.model';
import { WritingStrokeGuide } from '../../../writing/components/writing-stroke-guide/writing-stroke-guide';
import { Stroke } from '../../../../shared/models/writing/stroke.model';
import { ListPopup } from '../../../../shared/components/character-lists/list-popup/list-popup';
import { IconBtn } from '../../../../shared/components/icon-btn/icon-btn';
import { LoadingState } from '../../../../shared/components/app-state/loading-state/loading-state';

@Component({
  selector: 'app-character-meta',
  standalone: true,
  imports: [Chip, ChipGroup, Card, WritingStrokeGuide, ActionBtn, ListPopup, IconBtn, LoadingState],
  templateUrl: './character-meta.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './character-meta.scss',
})
export class CharacterMeta {
  private readonly router = inject(Router);
  private readonly practiceRoute = 'writing';
  private readonly guide = viewChild(WritingStrokeGuide);
  private readonly listPopup = viewChild(ListPopup);

  character = input.required<Character>();
  expectedUrl = input.required<string>();
  strokes = input<Stroke[]>([]);

  entries<T>(value: Record<string, T>): Array<[string, T]> {
    return Object.entries(value) as Array<[string, T]>;
  }

  label(key: string): string {
    return key.replace(/_/g, ' ');
  }

  openPractice = (): void => {
    const current = this.character();
    this.router.navigate([this.practiceRoute, current.kind, current.unicode]);
  };

  openListPopup = (): void => this.listPopup()?.openlistPopupModal();

  replay = (): void => this.guide()?.play();
}
