import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, User } from '../../../../shared/services/auth/auth.service';
import { ActionBtn } from '../../../../shared/components/action-btn/action-btn';
import { Confirmation } from '../../../../shared/components/confirmation/confirmation';

@Component({
  selector: 'app-profile',
  imports: [ActionBtn, Confirmation],
  templateUrl: './profile.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './profile.scss',
})
export class Profile {
  auth = inject(AuthService);
  private router = inject(Router);
  user = this.auth.user;
  username = computed(() => this.user()?.name ?? '');
  email = computed(() => this.user()?.email ?? '');
  verified = computed(() => this.user()?.verified ?? false);
  pictureUrl = computed(() => this.user()?.pictureUrl ?? '');
  readonly message = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly deleteConfirmationOpen = signal(false);
  verifyEmail = async (): Promise<void> => {
    this.message.set(null);
    this.error.set(null);
    this.message.set('Sending verification email...');
    try {
      await this.auth.requestEmailVerification();
      this.message.set('Check your email to verify your account.');
    } catch {
      this.message.set(null);
      this.error.set(this.auth.lastError() ?? 'The email could not be sent.');
    }
  };

  resetPassword = async (): Promise<void> => {
    this.message.set(null);
    this.error.set(null);
    try {
      await this.auth.requestPasswordResetForUser();
      this.message.set('Check your email to reset your password.');
    } catch {
      this.error.set(this.auth.lastError() ?? 'The email could not be sent.');
    }
  };

  openDeleteConfirmation = (): void => {
    this.deleteConfirmationOpen.set(true);
  };

  closeDeleteConfirmation = (): void => {
    this.deleteConfirmationOpen.set(false);
  };

  deleteAccount = async (): Promise<void> => {
    this.message.set(null);
    this.error.set(null);
    try {
      await this.auth.deleteProfile();
      await this.router.navigate(['/']);
    } catch {
      this.error.set(this.auth.lastError() ?? 'The account could not be deleted.');
    }
  };
}
