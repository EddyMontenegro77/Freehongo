import {
  Component,
  ElementRef,
  ViewChild,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
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
  private static googleInitialized = false;
  private auth = inject(AuthService);
  private router = inject(Router);
  @ViewChild('googleLoginBtn', { static: true }) googleLoginBtn!: ElementRef<HTMLButtonElement>;

  ready = signal(false);
  private pollId?: ReturnType<typeof setInterval>;
  private observer?: MutationObserver;

  ngAfterViewInit() {
    const init = () => {
      clearInterval(this.pollId);

      // GIS keeps this configuration globally. Multiple button components can
      // be created during navigation, so initialize it only once per page.
      if (!GoogleLoginBtn.googleInitialized) {
        google.accounts.id.initialize({
          client_id: environment.googleClientID,
          callback: async (resp: { credential: string }) => {
            try {
              await this.auth.googleAuth(resp.credential);
              await this.router.navigate(['/']);
            } catch {}
          },
        });
        GoogleLoginBtn.googleInitialized = true;
      }

      const host = this.googleLoginBtn.nativeElement;
      this.observer = new MutationObserver(() => {
        const iframe = host.querySelector('iframe');
        if (!iframe) return;
        this.observer?.disconnect();
        iframe.addEventListener('load', () => this.ready.set(true), { once: true });
        setTimeout(() => this.ready.set(true), 400);
      });
      this.observer.observe(host, { childList: true, subtree: true });

      google.accounts.id.renderButton(this.googleLoginBtn.nativeElement, {
        theme: 'outline',
        size: 'large',
        text: 'sign_in_with',
        shape: 'circular',
        logo_alignment: 'center',
      });
    };

    if (typeof google !== 'undefined') init();
    else {
      this.pollId = setInterval(() => {
        if (typeof google !== 'undefined') {
          clearInterval(this.pollId);
          init();
        }
      }, 100);
    }
  }

  ngOnDestroy() {
    clearInterval(this.pollId);
    this.observer?.disconnect();
  }
}
