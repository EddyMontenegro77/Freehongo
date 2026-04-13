import { Component, input, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ActionBtn } from '../../../../shared/components/action-btn/action-btn';
import { Card } from '../../../../shared/components/card/card';
import { Chip } from '../../../../shared/components/chip/chip';
import { ChipGroup } from '../../../../shared/components/chip-group/chip-group';
import { Character } from '../../../../shared/models/japanese/character.model';
import { Modal } from '../../../../shared/components/modal/modal';
import { IconBtn } from '../../../../shared/components/icon-btn/icon-btn';
import { ThemeService } from '../../../../shared/services/theme/theme.service';

@Component({
  selector: 'app-character-meta',
  standalone: true,
  imports: [Card, ActionBtn, Chip, ChipGroup, Modal, IconBtn],
  templateUrl: './character-meta.html',
  styleUrl: './character-meta.scss',
})
export class CharacterMeta {
  @ViewChild('expectedPreviewModal') expectedPreviewModal!: Modal;

  private readonly practiceRoute = 'writing';

  character = input.required<Character>();
  expectedUrl = input.required<string>();

  constructor(
    private router: Router,
    public themeService: ThemeService,
  ) {}

  entries<T>(value: Record<string, T>): Array<[string, T]> {
    return Object.entries(value) as Array<[string, T]>;
  }

  openPractice = (): void => {
    const current = this.character();
    this.router.navigate([this.practiceRoute, current.kind, current.unicode]);
  };

  openExpectedPreviewModal = (): void => {
    this.expectedPreviewModal.open();
  };

  closeExpectedPreviewModal = (): void => {
    this.expectedPreviewModal.close();
  };
}
