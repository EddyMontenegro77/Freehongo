import { Component, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../shared/services/auth/auth.service';
import { GoogleLoginBtn } from '../../components/google-login-btn/google-login-btn';
import { InputField } from '../../../../shared/components/input/input';
import { ActionBtn } from '../../../../shared/components/action-btn/action-btn';
import { LoadingState } from '../../../../shared/components/app-state/loading-state/loading-state';
import {
  email,
  form,
  minLength,
  required,
  FormField,
  FormRoot,
  validate,
} from '@angular/forms/signals';
import { FileUpload } from '../../../../shared/components/file-upload/file-upload';
import { SignupRequest } from '../../../../shared/models/auth/auth.models';

@Component({
  selector: 'app-signup',
  imports: [GoogleLoginBtn, InputField, ActionBtn, LoadingState, FormField, FormRoot, FileUpload],
  templateUrl: './signup.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './signup.scss',
})
export class Signup {
  auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly signUpModel = signal({
    email: '',
    name: '',
    password: '',
    passwordConfirmation: '',
  });

  readonly selectedPicture = signal<File | null>(null);
  readonly pictureError = signal<string | null>(null);

  readonly signUpForm = form(
    this.signUpModel,
    (schema) => {
      (required(schema.email, { message: 'Email is required' }),
        email(schema.email, { message: 'Invalid email' }),
        required(schema.name, { message: 'Name is required' }),
        required(schema.password, { message: 'Password is required' }),
        minLength(schema.password, 8, { message: 'Must have at least 8 characters' }),
        required(schema.passwordConfirmation, { message: 'Type your password again' }),
        validate(schema.passwordConfirmation, ({ value, valueOf }) => {
          const confirm = value();
          if (confirm && confirm !== valueOf(schema.password)) {
            return { kind: 'mismatch', message: 'Passwords do not match' };
          }
          return null;
        }));
    },
    {
      submission: {
        action: () => this.submitUser(),
      },
    },
  );

  submitUser = async (): Promise<void> => {
    if (this.pictureError()) return;

    const value = this.signUpForm().value();
    if (value.password !== value.passwordConfirmation) {
      this.auth.lastError.set('Passwords do not match.');
      return;
    }
    const userSignupRequest: SignupRequest = {
      name: value.name,
      email: value.email,
      password: value.password,
      picture: this.selectedPicture() ?? undefined,
    };

    await this.auth.signup(userSignupRequest);
    await this.router.navigateByUrl(this.getReturnUrl());
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

  private getReturnUrl(): string {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    return returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : '/';
  }
}
