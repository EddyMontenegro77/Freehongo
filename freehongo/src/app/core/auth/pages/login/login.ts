import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { InputField } from '../../../../shared/components/input/input';
import { ActionBtn } from '../../../../shared/components/action-btn/action-btn';
import { GoogleLoginBtn } from '../../components/google-login-btn/google-login-btn';

@Component({
  selector: 'app-login',
  imports: [InputField, ActionBtn, GoogleLoginBtn],
  templateUrl: './login.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './login.scss',
})
export class Login {
  userEmail = signal<string>('');
  password = signal<string>('');

  updateEmail(email: string) {
    this.userEmail.set(email);
  }

  updatePassword(password: string) {
    this.password.set(password);
  }

  submitUser = (): void => {};
}
