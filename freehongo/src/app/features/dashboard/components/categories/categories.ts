import { ChangeDetectionStrategy, Component, input, viewChild } from '@angular/core';
import { KeyValuePipe, UpperCasePipe } from '@angular/common';
import { CategoryProgress, DashboardCategory } from '../../models/dashboard.models';
import { Chip } from '../../../../shared/components/chip/chip';
import { ChipGroup } from '../../../../shared/components/chip-group/chip-group';
import { Progressbar } from '../../../../shared/components/progressbar/progressbar';
import { IconBtn } from '../../../../shared/components/icon-btn/icon-btn';
import { ActionBtn } from '../../../../shared/components/action-btn/action-btn';
import { Modal } from '../../../../shared/components/modal/modal';

export const LEVEL_CRITERIA = [
  { label: 'New', description: 'Little or no practice yet.' },
  { label: 'Beginner', description: 'You have started practicing, but the score is still low.' },
  { label: 'Intermediate', description: 'Mostly correct answers with a fair amount of practice.' },
  { label: 'Mastered', description: 'High accuracy sustained over enough attempts.' },
] as const;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KeyValuePipe, Chip, ChipGroup, Progressbar, IconBtn, ActionBtn, Modal, UpperCasePipe],
  selector: 'app-categories',
  styleUrl: './categories.scss',
  templateUrl: './categories.html',
})
export class Categories {
  data = input.required<Record<DashboardCategory, CategoryProgress>>();

  readonly criteria = LEVEL_CRITERIA;

  infoModal = viewChild<Modal>('infoModal');
  openModal = (): void => this.infoModal()?.open();
  closeModal = (): void => this.infoModal()?.close();

  masteredPercent(c: { totalCharacters: number; levelDistribution: { mastered: number } }): number {
    return c.totalCharacters ? (c.levelDistribution.mastered / c.totalCharacters) * 100 : 0;
  }
}
