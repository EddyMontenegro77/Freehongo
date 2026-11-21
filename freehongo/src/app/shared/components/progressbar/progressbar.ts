import { Component, computed, input, ChangeDetectionStrategy, signal } from '@angular/core';

export type ProgressBarVariant = 'default' | 'accent';

export interface Milestone {
  value: number;
  label: string;
}

@Component({
  selector: 'app-progressbar',
  standalone: true,
  templateUrl: './progressbar.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './progressbar.scss',
})
export class Progressbar {
  value = input<number>(0);
  max = input<number>(100);
  milestones = input<Milestone[]>([]);
  barAriaLabel = input<string>('Progress bar');
  variant = input<ProgressBarVariant>('default');

  percent = computed(() => this.toPercent(this.value()));

  progressAriaLabel = computed(() => `${this.barAriaLabel()}: ${Math.round(this.percent())}%`);

  position(milestone: Milestone): number {
    return this.toPercent(milestone.value);
  }

  reached(milestone: Milestone): boolean {
    return this.value() >= milestone.value;
  }

  private toPercent(value: number): number {
    const max = this.max();

    if (!Number.isFinite(max) || max <= 0 || !Number.isFinite(value)) {
      return 0;
    }

    return Math.min(100, Math.max(0, (value / max) * 100));
  }
}
