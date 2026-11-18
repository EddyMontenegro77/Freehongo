import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { NavigationBtn } from '../../../shared/components/navigation-btn/navigation-btn';
import { ActionBtn } from '../../../shared/components/action-btn/action-btn';
import { Router } from '@angular/router';
import { AuthService } from '../../../shared/services/auth/auth.service';
import { ThemeService } from '../../../shared/services/theme/theme.service';

@Component({
  selector: 'app-navigation',
  imports: [NavigationBtn, ActionBtn],
  templateUrl: './navigation.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './navigation.scss',
})
export class Navigation {
  auth = inject(AuthService);
  router = inject(Router);
  theme = inject(ThemeService);

  logOut = async (): Promise<void> => {
    await this.router.navigate(['/auth/logout']);
  };

  changeTheme = (): void => {
    this.theme.toggleTheme();
  };
}
