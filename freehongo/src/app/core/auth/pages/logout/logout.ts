import { Component, inject } from '@angular/core';
import { AuthService } from '../../../../shared/services/auth/auth.service';
import { Router } from '@angular/router';
import { LoadingState } from '../../../../shared/components/app-state/loading-state/loading-state';

@Component({
  imports: [LoadingState],
  selector: 'app-logout',
  styleUrl: './logout.scss',
  templateUrl: './logout.html',
})
export class Logout {
  auth = inject(AuthService);
  router = inject(Router);

  ngOnInit() {
    this.logOut();
  }
  logOut = async (): Promise<void> => {
    try {
      await this.auth.logout();
    } catch (e) {
      console.log(e);
    } finally {
      await this.router.navigate(['/auth/login'], { replaceUrl: true });
    }
  };
}
