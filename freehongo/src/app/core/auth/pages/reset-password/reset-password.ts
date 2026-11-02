import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ActionBtn } from '../../../../shared/components/action-btn/action-btn';
import { InputField } from '../../../../shared/components/input/input';
import { LoadingState } from '../../../../shared/components/app-state/loading-state/loading-state';
import { AuthService } from '../../../../shared/services/auth/auth.service';
import {
  FormField,
  FormRoot,
  form,
  minLength,
  required,
  validate,
} from '@angular/forms/signals';

@Component({
  selector: 'app-reset-password',
  imports: [ActionBtn, InputField, LoadingState, FormField, FormRoot],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class ResetPassword {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';
  readonly resetModel = signal({ password: '', confirmation: '' });
  readonly resetForm = form(
    this.resetModel,
    (schema) => {
      required(schema.password, { message: 'Password is required' });
      minLength(schema.password, 8, { message: 'Must have at least 8 characters' });
      required(schema.confirmation, { message: 'Type your password again' });
      validate(schema.confirmation, ({ value, valueOf }) => {
        const confirmation = value();
        if (confirmation && confirmation !== valueOf(schema.password)) {
          return { kind: 'mismatch', message: 'Passwords do not match' };
        }
        return null;
      });
    },
    { submission: { action: () => this.submit() } },
  );
  readonly isProcessing = signal(false);
  readonly message = signal<string | null>(null);

  submit = async (): Promise<void> => {
    this.message.set(null);
    if (!this.token) {
      this.message.set('The recovery link is invalid.');
      return;
    }
    const value = this.resetForm().value();
    if (value.password !== value.confirmation) {
      this.message.set('Passwords do not match.');
      return;
    }
    this.isProcessing.set(true);
    try {
      await this.auth.resetPassword(this.token, value.password);
      this.message.set('Password updated. You can now log in.');
      await this.router.navigateByUrl('/auth/login');
    } catch {
      this.message.set(this.auth.lastError() ?? 'The password could not be updated.');
    } finally {
      this.isProcessing.set(false);
    }
  };
}
