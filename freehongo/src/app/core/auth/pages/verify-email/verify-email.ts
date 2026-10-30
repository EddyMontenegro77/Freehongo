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
  readonly message = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  constructor() {
    void this.verify();
  }

  private async verify(): Promise<void> {
    const token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!token) {
      this.error.set('The verification link is invalid.');
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

  goToHome = async (): Promise<void> => {
    await this.router.navigateByUrl('/');
  };
}
