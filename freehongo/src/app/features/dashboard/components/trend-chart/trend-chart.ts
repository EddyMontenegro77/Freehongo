import { Component, ElementRef, OnDestroy, effect, inject, input, viewChild } from '@angular/core';
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  ChartConfiguration,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  TooltipItem,
} from 'chart.js';
import { TrendChartConfig } from '../../models/dashboard.models';

Chart.register(
  BarController,
  LineController,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
);

@Component({
  selector: 'app-trend-chart',
  styleUrl: './trend-chart.scss',
  templateUrl: './trend-chart.html',
})
export class TrendChart implements OnDestroy {
  readonly config = input.required<TrendChartConfig>();
  readonly height = input(260);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private chart?: Chart<'bar' | 'line'>;

  constructor() {
    effect(() => {
      const canvas = this.canvas();
      const config = this.config();
      if (!canvas) return;
      this.render(canvas.nativeElement, config);
    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private render(canvas: HTMLCanvasElement, cfg: TrendChartConfig): void {
    this.chart?.destroy();

    const styles = getComputedStyle(this.host.nativeElement);
    const cssVar = (name: string, fallback: string): string =>
      styles.getPropertyValue(name).trim() || fallback;

    const text = cssVar('--text', '#cbd5e1');
    const grid = cssVar('--border', 'rgba(148, 163, 184, 0.25)');
    const usesSecondaryAxis = cfg.datasets.some((d) => d.yAxisID === 'y1');

    const config: ChartConfiguration<'bar' | 'line'> = {
      type: 'bar',
      data: {
        labels: cfg.labels,
        datasets: cfg.datasets.map((d) => {
          const color = d.colorVar ? cssVar(d.colorVar, d.color) : d.color;
          return {
            type: d.type,
            label: d.label,
            data: d.data,
            yAxisID: d.yAxisID,
            borderColor: color,
            backgroundColor: color,
            borderWidth: d.type === 'line' ? 2 : 0,
            borderRadius: 4,
            tension: 0.3,
            pointRadius: 3,
            spanGaps: true,
            order: d.type === 'line' ? 0 : 1,
          };
        }),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: text, maxRotation: 0, autoSkip: true, maxTicksLimit: 10 },
          },
          y: {
            min: 0,
            max: 100,
            grid: { color: grid },
            ticks: { color: text, callback: (v) => `${v}%` },
          },
          y1: {
            display: usesSecondaryAxis,
            position: 'right',
            beginAtZero: true,
            grid: { drawOnChartArea: false },
            ticks: { color: text, precision: 0 },
          },
        },
        plugins: {
          legend: { labels: { color: text } },
          tooltip: {
            callbacks: {
              label: (ctx: TooltipItem<'bar' | 'line'>) => {
                const value = ctx.parsed.y;
                if (value === null || value === undefined) return `${ctx.dataset.label}: —`;
                const rounded = Math.round(value * 10) / 10;
                return `${ctx.dataset.label}: ${rounded}${ctx.dataset.yAxisID === 'y' ? '%' : ''}`;
              },
            },
          },
        },
      },
    };

    this.chart = new Chart(canvas, config);
  }
}
