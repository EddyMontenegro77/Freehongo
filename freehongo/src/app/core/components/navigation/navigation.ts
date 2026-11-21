import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { NavigationBtn } from '../../../shared/components/navigation-btn/navigation-btn';
import { Router } from '@angular/router';
import { AuthService } from '../../../shared/services/auth/auth.service';
import { ThemeService } from '../../../shared/services/theme/theme.service';
import { IconBtn } from '../../../shared/components/icon-btn/icon-btn';

@Component({
  selector: 'app-navigation',
  imports: [NavigationBtn, IconBtn],
  templateUrl: './navigation.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './navigation.scss',
})
export class Navigation {
  auth = inject(AuthService);
  router = inject(Router);
  theme = inject(ThemeService);

  menuOpen = signal(false);

  toggleMenu = (): void => this.menuOpen.update((open) => !open);

  closeMenu = (): void => this.menuOpen.set(false);

  logOut = async (): Promise<void> => {
    await this.router.navigate(['/auth/logout']);
  };

  changeTheme = (): void => {
    this.theme.toggleTheme();
  };
}
