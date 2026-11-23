import { ChangeDetectionStrategy, Component, input, viewChild } from '@angular/core';
import { DashboardSkill, SkillProgress } from '../../models/dashboard.models';
import { KeyValuePipe, UpperCasePipe } from '@angular/common';
import { ResponseTimePipe } from '../../../../shared/pipes/response-time.pipe';
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

type LevelDistribution = { new: number; beginner: number; intermediate: number; mastered: number };

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    KeyValuePipe,
    ResponseTimePipe,
    Chip,
    ChipGroup,
    Progressbar,
    IconBtn,
    ActionBtn,
    Modal,
    UpperCasePipe,
  ],
  selector: 'app-skills',
  styleUrl: './skills.scss',
  templateUrl: './skills.html',
})
export class Skills {
  data = input.required<Record<DashboardSkill, SkillProgress>>();

  readonly criteria = LEVEL_CRITERIA;
  readonly keepOrder = (): number => 0;

  infoModal = viewChild<Modal>('infoModal');
  openModal = (): void => this.infoModal()?.open();
  closeModal = (): void => this.infoModal()?.close();

  masteredPercent(skill: { levelDistribution: LevelDistribution }): number {
    const d = skill.levelDistribution;
    const total = d.new + d.beginner + d.intermediate + d.mastered;
    return total ? (d.mastered / total) * 100 : 0;
  }
}
