import { Component, ElementRef, ViewChild, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../../../environments/environments';
import { AuthService } from '../../../../shared/services/auth/auth.service';
declare const google: any;

@Component({
  selector: 'app-google-login-btn',
  imports: [],
  templateUrl: './google-login-btn.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './google-login-btn.scss',
})
export class GoogleLoginBtn {
  private auth = inject(AuthService);
  private router = inject(Router);
  @ViewChild('googleLoginBtn', { static: true }) googleLoginBtn!: ElementRef<HTMLButtonElement>;

  ngAfterViewInit() {
    const init = () => {
      google.accounts.id.initialize({
        client_id: environment.googleClientID,
        callback: async (resp: { credential: string }) => {
          try {
            await this.auth.googleAuth(resp.credential);
            await this.router.navigate(['/']);
          } catch {
            // AuthService exposes the backend error to the auth screen.
          }
        },
      });
      google.accounts.id.renderButton(this.googleLoginBtn.nativeElement, {
        theme: 'outline',
        size: 'large',
        text: 'sign_in_with',
        shape: 'circular',
        logo_alignment: 'center',
      });
    };

    // El script es async: puede no estar listo todavía
    if (typeof google !== 'undefined') init();
    else {
      const t = setInterval(() => {
        if (typeof google !== 'undefined') {
          clearInterval(t);
          init();
        }
      }, 100);
    }
  }
}
