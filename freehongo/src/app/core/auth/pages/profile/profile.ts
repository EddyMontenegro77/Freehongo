import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, User } from '../../../../shared/services/auth/auth.service';
import { ActionBtn } from '../../../../shared/components/action-btn/action-btn';
import { Confirmation } from '../../../../shared/components/confirmation/confirmation';
import { Card } from '../../../../shared/components/card/card';
import { Chip } from '../../../../shared/components/chip/chip';
import { Modal } from '../../../../shared/components/modal/modal';
import { FileUpload } from '../../../../shared/components/file-upload/file-upload';

@Component({
  selector: 'app-profile',
  imports: [ActionBtn, Confirmation, Card, Chip, Modal, FileUpload],
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
  private readonly pictureVersion = signal(Date.now());
  pictureUrl = computed(() => {
    const url = this.user()?.pictureUrl ?? '';
    return url ? `${url}${url.includes('?') ? '&' : '?'}v=${this.pictureVersion()}` : '';
  });
  readonly message = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly isUpdatingPfp = signal<boolean>(false);
  readonly deleteConfirmationOpen = signal(false);

  readonly selectedPicture = signal<File | null>(null);
  readonly pictureError = signal<string | null>(null);

  updatePictureModal = viewChild<Modal>('updatePictureModal');

  verifyEmail = async (): Promise<void> => {
    this.message.set(null);
    this.error.set(null);
    this.message.set('Sending verification email...');
    try {
      await this.auth.requestEmailVerificationForUser();
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

  onPictureChange(files: File[]): void {
    this.selectedPicture.set(files[0] ?? null);
    if (files.length > 0) {
      this.pictureError.set(null);
    }
  }

  onPictureError(message: string): void {
    this.selectedPicture.set(null);
    this.pictureError.set(message);
  }

  openModal = (): void => this.updatePictureModal()?.open();
  closeModal = (): void => this.updatePictureModal()?.close();

  updatePfp = async (): Promise<void> => {
    const picture = this.selectedPicture();

    if (!picture) {
      this.pictureError.set('Choose an image first.');
      return;
    }

    this.isUpdatingPfp.set(true);
    this.message.set(null);
    this.error.set(null);

    try {
      await this.auth.updateProfilePicture(picture);
      this.selectedPicture.set(null);
      this.pictureVersion.set(Date.now());
      this.closeModal();
      this.message.set('Profile picture updated.');
    } catch {
      this.error.set(this.auth.lastError() ?? 'The profile picture could not be updated.');
    } finally {
      this.isUpdatingPfp.set(false);
    }
  };
}
