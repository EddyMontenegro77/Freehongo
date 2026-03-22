import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

const THEME_STORAGE_KEY = 'freehongo-theme';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private document = inject(DOCUMENT);

  initTheme(): ThemeMode {
    const savedTheme = this.getSavedTheme();
    const preferredTheme = this.getPreferredTheme();
    const theme = savedTheme ?? preferredTheme;

    this.applyTheme(theme);
    return theme;
  }

  setTheme(theme: ThemeMode): void {
    this.applyTheme(theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }

  toggleTheme(): ThemeMode {
    const currentTheme = this.getTheme();
    const nextTheme: ThemeMode = currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(nextTheme);
    return nextTheme;
  }

  getTheme(): ThemeMode {
    return this.getSavedTheme() ?? this.getPreferredTheme();
  }

  private applyTheme(theme: ThemeMode): void {
    this.document.documentElement.setAttribute('data-theme', theme);
  }

  private getSavedTheme(): ThemeMode | null {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
    return null;
  }

  private getPreferredTheme(): ThemeMode {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
