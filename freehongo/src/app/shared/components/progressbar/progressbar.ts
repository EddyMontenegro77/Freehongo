import { Component, computed, input } from '@angular/core';

export interface Milestone {
  value: number;
  label: string;
}

@Component({
  selector: 'app-progressbar',
  styleUrl: './progressbar.scss',
  templateUrl: './progressbar.html',
})
export class Progressbar {
  value = input<number>(0);
  max = input<number>(100);
  milestones = input<Milestone[]>([]);
  barAriaLabel = input<string>('Progress bar');

  percent = computed(() => {
    const max = this.max();
    const value = this.value();

    if (!Number.isFinite(max) || max <= 0 || !Number.isFinite(value)) {
      return 0;
    }

    return Math.min(100, Math.max(0, (value / max) * 100));
  });

  progressAriaLabel = computed(() => `${this.barAriaLabel()}: ${this.percent()}%`);

  position(milestone: Milestone) {
    const max = this.max();

    if (!Number.isFinite(max) || max <= 0 || !Number.isFinite(milestone.value)) {
      return 0;
    }

    return Math.min(100, Math.max(0, (milestone.value / max) * 100));
  }

  reached(milestone: Milestone) {
    return this.value() >= milestone.value;
  }
}
