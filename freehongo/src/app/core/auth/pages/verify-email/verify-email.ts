import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ActionBtn } from '../../../../shared/components/action-btn/action-btn';
import { LoadingState } from '../../../../shared/components/app-state/loading-state/loading-state';
import { AuthService } from '../../../../shared/services/auth/auth.service';

@Component({
  selector: 'app-verify-email',
  imports: [ActionBtn, LoadingState],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class VerifyEmail {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isProcessing = signal(true);
  readonly isPending = signal(false);
  readonly email = signal('');
  readonly resendMessage = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  constructor() {
    void this.verify();
  }

  private async verify(): Promise<void> {
    const token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!token) {
      const pending = this.route.snapshot.queryParamMap.get('pending') === 'true';
      if (!pending) {
        this.error.set('The verification link is invalid.');
      } else {
        this.email.set(this.route.snapshot.queryParamMap.get('email') ?? '');
        this.isPending.set(true);
      }
      this.isProcessing.set(false);
      return;
    }
    try {
      await this.auth.verifyEmail(token);
      this.message.set('Your email was verified successfully.');
      await this.router.navigateByUrl('/');
    } catch {
      this.error.set(this.auth.lastError() ?? 'The email could not be verified.');
    } finally {
      this.isProcessing.set(false);
    }
  }

  goToLogin = async (): Promise<void> => {
    await this.router.navigateByUrl('/auth/login');
  };

  resendVerification = async (): Promise<void> => {
    this.resendMessage.set(null);
    this.error.set(null);
    try {
      await this.auth.requestEmailVerification(this.email().trim());
      this.resendMessage.set('If an account exists, a verification email has been sent.');
    } catch {
      this.error.set(this.auth.lastError() ?? 'The email could not be sent.');
    }
  };

  goToHome = async (): Promise<void> => {
    await this.router.navigateByUrl('/');
  };
}
