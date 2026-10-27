import { Component, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../shared/services/auth/auth.service';
import { GoogleLoginBtn } from '../../components/google-login-btn/google-login-btn';
import { InputField } from '../../../../shared/components/input/input';
import { ActionBtn } from '../../../../shared/components/action-btn/action-btn';
import { LoadingState } from '../../../../shared/components/app-state/loading-state/loading-state';

@Component({
  selector: 'app-signup',
  imports: [GoogleLoginBtn, InputField, ActionBtn, LoadingState],
  templateUrl: './signup.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './signup.scss',
})
export class Signup {
  auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  userEmail = signal<string>('');
  username = signal<string>('');
  password = signal<string>('');
  passwordConfirmation = signal<string>('');

  updateEmail(email: string) {
    this.userEmail.set(email);
  }

  updateUsername(username: string) {
    this.username.set(username);
  }

  updatePassword(password: string) {
    this.password.set(password);
  }

  updatePasswordConfirmation(passwordConfirmation: string) {
    this.passwordConfirmation.set(passwordConfirmation);
  }

  submitUser = async (): Promise<void> => {
    if (this.password() !== this.passwordConfirmation()) {
      this.auth.lastError.set('Las contraseñas no coinciden.');
      return;
    }

    await this.auth.signup(this.username(), this.userEmail(), this.password());
    await this.router.navigateByUrl(this.getReturnUrl());
  };

  private getReturnUrl(): string {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    return returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : '/';
  }
}
