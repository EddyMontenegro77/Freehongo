import { Component, ElementRef, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { environment } from '../../../../../environments/environments';
declare const google: any;

@Component({
  selector: 'app-google-login-btn',
  imports: [],
  templateUrl: './google-login-btn.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './google-login-btn.scss',
})
export class GoogleLoginBtn {
  @ViewChild('googleLoginBtn', { static: true }) googleLoginBtn!: ElementRef<HTMLButtonElement>;

  ngAfterViewInit() {
    const init = () => {
      google.accounts.id.initialize({
        client_id: environment.googleClientID,
        callback: async (resp: { credential: string }) => {
          console.log('credential:', resp.credential);
          const res = await fetch(`${environment.apiUrl}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ Credential: resp.credential }),
          });
          console.log(res.status, await res.json());
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
