import { Component, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../shared/services/auth/auth.service';
import { InputField } from '../../../../shared/components/input/input';
import { ActionBtn } from '../../../../shared/components/action-btn/action-btn';
import { GoogleLoginBtn } from '../../components/google-login-btn/google-login-btn';
import { LoadingState } from '../../../../shared/components/app-state/loading-state/loading-state';
import {
  email,
  form,
  required,
  schema,
  FormField,
  minLength,
  FormRoot,
} from '@angular/forms/signals';

@Component({
  selector: 'app-login',
  imports: [InputField, ActionBtn, GoogleLoginBtn, LoadingState, FormField, FormRoot],
  templateUrl: './login.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './login.scss',
})
export class Login {
  auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly loginModel = signal({
    email: '',
    password: '',
  });
  readonly resetMessage = signal<string | null>(null);

  readonly loginForm = form(
    this.loginModel,
    (schema) => {
      (required(schema.email, { message: 'Email is required' }),
        email(schema.email, { message: 'Invalid email' }),
        required(schema.password, { message: 'Password is required' }),
        minLength(schema.password, 8, { message: 'Must have at least 8 characters' }));
    },
    {
      submission: {
        action: () => this.submitUser(),
      },
    },
  );

  async submitUser(): Promise<void> {
    const { email, password } = this.loginForm().value();
    await this.auth.login(email, password);
    await this.router.navigateByUrl(this.getReturnUrl());
  }

  requestPasswordReset = async (): Promise<void> => {
    this.resetMessage.set(null);
    try {
      await this.auth.requestPasswordReset(this.loginForm().value().email);
      this.resetMessage.set('Check your email to reset your password.');
    } catch {
      // AuthService exposes the backend error through lastError.
    }
  };

  private getReturnUrl(): string {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    return returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : '/';
  }
}
