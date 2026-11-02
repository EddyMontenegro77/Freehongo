import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { NavigationBtn } from '../../../shared/components/navigation-btn/navigation-btn';
import { AuthService } from '../../../shared/services/auth/auth.service';
import { ActionBtn } from '../../../shared/components/action-btn/action-btn';
import { Router } from '@angular/router';

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

  logOut = async (): Promise<void> => {
    try {
      await this.auth.logout();
    } catch (e) {
      console.log(e);
    } finally {
      await this.router.navigate(['/auth/login']);
    }
  };
}
