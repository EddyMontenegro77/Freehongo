import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { AuthService, User } from '../../../../shared/services/auth/auth.service';
import { ActionBtn } from '../../../../shared/components/action-btn/action-btn';

@Component({
  selector: 'app-profile',
  imports: [ActionBtn],
  templateUrl: './profile.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './profile.scss',
})
export class Profile {
  auth = inject(AuthService);
  user = this.auth.user;
  username = computed(() => this.user()?.name ?? '');
  email = computed(() => this.user()?.email ?? '');
  verified = computed(() => this.user()?.verified ?? false);
  pictureUrl = computed(() => this.user()?.pictureUrl ?? '');

  verifyEmail = async (): Promise<void> => {};
}
