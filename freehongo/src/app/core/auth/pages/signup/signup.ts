import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { GoogleLoginBtn } from '../../components/google-login-btn/google-login-btn';
import { InputField } from '../../../../shared/components/input/input';
import { ActionBtn } from '../../../../shared/components/action-btn/action-btn';

@Component({
  selector: 'app-signup',
  imports: [GoogleLoginBtn, InputField, ActionBtn],
  templateUrl: './signup.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './signup.scss',
})
export class Signup {
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

  submitUser = (): void => {};
}
