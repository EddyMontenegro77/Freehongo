import { Component, computed, input, signal, viewChild } from '@angular/core';
import { Card } from '../../../../shared/components/card/card';
import {
  SegmentedControl,
  SegmentedOption,
} from '../../../../shared/components/segmented-control/segmented-control';
import {
  DashboardSkill,
  SKILL_LABELS,
  TrendChartConfig,
  TrendGranularity,
  TrendPeriod,
  TrendsData,
} from '../../models/dashboard.models';
import { comparePeriods, filterBuckets, toSeries, totalsOf } from '../../utils/dashboard.utils';
import { TrendChart } from '../trend-chart/trend-chart';
import { Chip } from '../../../../shared/components/chip/chip';
import { SelectField, SelectOption } from '../../../../shared/components/select/select';
import { IconBtn } from '../../../../shared/components/icon-btn/icon-btn';
import { Modal } from '../../../../shared/components/modal/modal';
import { ActionBtn } from '../../../../shared/components/action-btn/action-btn';

type SkillFilter = DashboardSkill | 'all';

const SKILLS: DashboardSkill[] = ['reading', 'meaning', 'writing'];

const SKILL_COLOR_VARS: Record<DashboardSkill, string> = {
  reading: '--color-temp',
  meaning: '--color-bittersweet',
  writing: '--color-success',
};

const cssVar = (name: string): string =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export const skillColor = (skill: DashboardSkill): string => cssVar(SKILL_COLOR_VARS[skill]);

const labelOf = (dateKey: string): string => `${dateKey.slice(8, 10)}/${dateKey.slice(5, 7)}`;

interface SummaryCard {
  label: string;
  value: string;
  delta: string | null;
  trend: 'up' | 'down' | 'flat';
}

@Component({
  imports: [Card, SegmentedControl, TrendChart, Chip, SelectField, IconBtn, ActionBtn, Modal],
  selector: 'app-trends',
  styleUrl: './trends.scss',
  templateUrl: './trends.html',
})
export class Trends {
  readonly data = input.required<TrendsData>();
  infoModal = viewChild<Modal>('infoModal');

  onPeriodSelect(raw: string): void {
    const value = this.fromSelectValue(this.periodOptions, raw);
    if (value !== undefined) this.period.set(value);
  }

  onSkillSelect(raw: string): void {
    const value = this.fromSelectValue(this.skillOptions, raw);
    if (value !== undefined) this.skill.set(value);
  }

  private toSelectOptions<T extends string | number>(
    options: readonly SegmentedOption<T>[],
  ): SelectOption<string>[] {
    return options.map((o) => ({ ...o, value: String(o.value) }));
  }

  private fromSelectValue<T extends string | number>(
    options: readonly SegmentedOption<T>[],
    raw: string,
  ): T | undefined {
    return options.find((o) => String(o.value) === raw)?.value;
  }

  readonly periodOptions: ReadonlyArray<SegmentedOption<TrendPeriod>> = [
    { label: '7 days', value: 7 },
    { label: '30 days', value: 30 },
    { label: '90 days', value: 90 },
    { label: 'All', value: 'all' },
  ];

  readonly skillOptions: ReadonlyArray<SegmentedOption<SkillFilter>> = [
    { label: 'All', value: 'all' },
    { label: SKILL_LABELS.reading, value: 'reading' },
    { label: SKILL_LABELS.meaning, value: 'meaning' },
    { label: SKILL_LABELS.writing, value: 'writing' },
  ];

  readonly period = signal<TrendPeriod>(30);
  readonly skill = signal<SkillFilter>('all');
  readonly periodSelectOptions = this.toSelectOptions(this.periodOptions);
  readonly skillSelectOptions = this.toSelectOptions(this.skillOptions);

  readonly periodSelectValue = computed(() => String(this.period()));
  readonly skillSelectValue = computed(() => String(this.skill()));

  openModal = (): void => this.infoModal()?.open();
  closeModal = (): void => this.infoModal()?.close();

  private readonly granularity = computed<TrendGranularity>(() =>
    this.period() === 'all' ? 'week' : 'day',
  );

  private readonly filtered = computed(() =>
    filterBuckets(this.data().buckets, this.period(), this.skill()),
  );

  readonly hasEnoughData = computed(() => new Set(this.filtered().map((b) => b.date)).size >= 2);

  private readonly series = computed(() =>
    toSeries(this.filtered(), this.granularity(), this.period()),
  );

  private readonly totals = computed(() => totalsOf(this.filtered()));
  private readonly comparison = computed(() =>
    comparePeriods(this.data().buckets, this.period(), this.skill()),
  );

  readonly cards = computed<SummaryCard[]>(() => {
    const totals = this.totals();
    const comparison = this.comparison();

    return [
      {
        label: 'Accuracy',
        value: totals.accuracy === null ? '—' : `${Math.round(totals.accuracy)}%`,
        ...this.deltaOf(comparison?.accuracyDelta ?? null, ' pts'),
      },
      {
        label: 'Questions',
        value: String(totals.attempts),
        ...this.deltaOf(comparison?.attemptsDelta ?? null, '%'),
      },
      {
        label: 'Study time',
        value: this.duration(totals.studyTimeMs),
        delta: null,
        trend: 'flat',
      },
    ];
  });

  readonly mainChart = computed<TrendChartConfig>(() => {
    const series = this.series();

    return {
      labels: series.map((p) => labelOf(p.date)),
      datasets: [
        {
          label: 'Questions',
          type: 'bar',
          yAxisID: 'y1',
          data: series.map((p) => p.attempts),
          color: '#64748b88',
        },
        {
          label: 'Accuracy',
          type: 'line',
          yAxisID: 'y',
          data: series.map((p) => p.accuracy),
          color: '#4f8cff',
          colorVar: '--accent',
        },
      ],
    };
  });

  readonly skillChart = computed<TrendChartConfig>(() => {
    const { buckets } = this.data();
    const period = this.period();
    const granularity = this.granularity();

    const base = toSeries(filterBuckets(buckets, period, 'all'), granularity, period);
    const dates = base.map((p) => p.date);

    const datasets = SKILLS.flatMap((skill) => {
      const points = toSeries(filterBuckets(buckets, period, skill), granularity, period);
      if (!points.some((p) => p.attempts > 0)) return [];

      const byDate = new Map(points.map((p) => [p.date, p.accuracy]));
      return [
        {
          label: SKILL_LABELS[skill],
          type: 'line' as const,
          yAxisID: 'y' as const,
          data: dates.map((d) => byDate.get(d) ?? null),
          color: skillColor(skill),
        },
      ];
    });

    return { labels: dates.map(labelOf), datasets };
  });

  private deltaOf(
    value: number | null,
    unit: string,
  ): { delta: string | null; trend: 'up' | 'down' | 'flat' } {
    if (value === null) return { delta: null, trend: 'flat' };
    const rounded = Math.round(value);
    if (rounded === 0) return { delta: `0${unit}`, trend: 'flat' };
    return {
      delta: `${rounded > 0 ? '+' : ''}${rounded}${unit}`,
      trend: rounded > 0 ? 'up' : 'down',
    };
  }

  private duration(ms: number): string {
    if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
    const minutes = Math.round(ms / 60_000);
    if (minutes < 60) return `${minutes} min`;
    return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
  }
}
