import { Component, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../shared/services/auth/auth.service';
import { InputField } from '../../../../shared/components/input/input';
import { ActionBtn } from '../../../../shared/components/action-btn/action-btn';
import { GoogleLoginBtn } from '../../components/google-login-btn/google-login-btn';
import { LoadingState } from '../../../../shared/components/app-state/loading-state/loading-state';

@Component({
  selector: 'app-login',
  imports: [InputField, ActionBtn, GoogleLoginBtn, LoadingState],
  templateUrl: './login.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './login.scss',
})
export class Login {
  auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  userEmail = signal<string>('');
  password = signal<string>('');

  updateEmail(email: string) {
    this.userEmail.set(email);
  }

  updatePassword(password: string) {
    this.password.set(password);
  }

  submitUser = async (): Promise<void> => {
    await this.auth.login(this.userEmail(), this.password());
    await this.router.navigateByUrl(this.getReturnUrl());
  };

  private getReturnUrl(): string {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    return returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : '/';
  }
}
