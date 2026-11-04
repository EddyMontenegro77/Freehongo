import { Injectable, computed, inject, signal } from '@angular/core';
import { DashboardDataService } from './dashboard-data.service';
import { DashboardData, CharacterProgress, TrendPeriod } from '../models/dashboard.models';

@Injectable({ providedIn: 'root' })
export class DashboardFacade {
  private readonly dataService = inject(DashboardDataService);
  private readonly dataState = signal<DashboardData | null>(null);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly period = signal<TrendPeriod>(30);
  readonly search = signal('');
  readonly category = signal<string>('all');
  readonly level = signal<string>('all');
  readonly data = computed(() => this.dataState());
  readonly filteredCharacters = computed(() => {
    const data = this.dataState();
    if (!data) return [];
    const query = this.search().trim().toLowerCase();
    return data.characters.filter((character) =>
      (!query || character.literal.toLowerCase().includes(query) || character.unicode.toLowerCase().includes(query)) &&
      (this.category() === 'all' || character.category === this.category()) &&
      (this.level() === 'all' || character.level === this.level()),
    );
  });

  async load(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      this.dataState.set(await this.dataService.getDashboard(this.period()));
    } catch {
      this.error.set('Unable to load your learning progress.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async changePeriod(period: TrendPeriod): Promise<void> {
    this.period.set(period);
    await this.load();
  }

  selectCharacter(character: CharacterProgress): void {
    this.selectedCharacter.set(character);
  }

  readonly selectedCharacter = signal<CharacterProgress | null>(null);
}
