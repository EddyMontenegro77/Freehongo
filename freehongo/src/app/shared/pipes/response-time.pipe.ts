import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'responseTime' })
export class ResponseTimePipe implements PipeTransform {
  transform(ms: number | null | undefined, secondsThreshold = 1000): string {
    if (ms === null || ms === undefined || !Number.isFinite(ms)) return '—';

    const rounded = Math.round(ms);
    if (rounded < secondsThreshold) return `${rounded} ms`;

    return `${(ms / 1000).toFixed(1)} s`;
  }
}
