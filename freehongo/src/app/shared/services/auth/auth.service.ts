import { Service, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';
import { environment } from '../../../../environments/environments';
import { SignupRequest } from '../../models/auth/auth.models';
import { DatabaseService } from '../../../core/db/services/database.service';
import { SyncService } from '../../../core/sync/sync.service';

export interface User {
  userId: string;
  name: string;
  email: string;
  verified: boolean;
  pictureUrl?: string | null;
}

@Service()
export class AuthService {
  private http = inject(HttpClient);
  private databaseService = inject(DatabaseService);
  private syncService = inject(SyncService);

  private readonly _user = signal<User | null>(null);
  readonly user = this._user.asReadonly();
  readonly isAuth = computed(() => this._user() !== null);
  readonly lastError = signal<string | null>(null);
  readonly isProcessing = signal(false);

  async loadSession(): Promise<void> {
    try {
      const user = await firstValueFrom(
        this.http
          .get<User>(`${environment.apiUrl}/auth/me`, {
            withCredentials: true,
          })
          .pipe(timeout({ first: 5000 })),
      );
      await this.databaseService.initialize(user.userId);
      this._user.set(user);
    } catch {
      await this.databaseService.initialize();
      this._user.set(null);
    }
  }

  async googleAuth(credential: string): Promise<void> {
    this.lastError.set(null);
    this.isProcessing.set(true);
    try {
      await firstValueFrom(
        this.http.post(
          `${environment.apiUrl}/auth/google`,
          { credential },
          { withCredentials: true },
        ),
      );
      await this.loadSession();
    } catch (error) {
      this.lastError.set(this.getErrorMessage(error));
      throw error;
    } finally {
      this.isProcessing.set(false);
    }
  }

  async login(email: string, password: string): Promise<void> {
    this.lastError.set(null);
    this.isProcessing.set(true);
    try {
      await firstValueFrom(
        this.http.post(
          `${environment.apiUrl}/auth/login`,
          { email, password },
          { withCredentials: true },
        ),
      );
      await this.loadSession();
    } catch (error) {
      this.lastError.set(this.getErrorMessage(error));
      throw error;
    } finally {
      this.isProcessing.set(false);
    }
  }

  async signup(signupReq: SignupRequest): Promise<void> {
    this.lastError.set(null);
    this.isProcessing.set(true);
    try {
      const body = signupReq.picture
        ? this.buildSignupFormData(signupReq)
        : {
            name: signupReq.name,
            email: signupReq.email,
            password: signupReq.password,
          };
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/auth/signup`, body, { withCredentials: true }),
      );
    } catch (error) {
      this.lastError.set(this.getErrorMessage(error));
      throw error;
    } finally {
      this.isProcessing.set(false);
    }
  }

  private buildSignupFormData(signupReq: SignupRequest): FormData {
    const formData = new FormData();
    formData.append('name', signupReq.name);
    formData.append('email', signupReq.email);
    formData.append('password', signupReq.password);
    formData.append('picture', signupReq.picture!);
    return formData;
  }

  async logout(): Promise<void> {
    if (!this._user()) return;

    try {
      await Promise.race([
        this.syncService.sync().catch(() => undefined),
        new Promise<void>((resolve) => setTimeout(resolve, 5000)),
      ]);

      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/auth/logout`, {}, { withCredentials: true }),
      );
    } finally {
      this._user.set(null);
      await this.databaseService.initialize();
    }
  }

  async requestEmailVerification(email: string): Promise<void> {
    this.lastError.set(null);
    try {
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/auth/verify-email/request`, { email }),
      );
    } catch (error) {
      this.lastError.set(this.getErrorMessage(error));
      throw error;
    }
  }

  async requestEmailVerificationForUser(): Promise<void> {
    this.lastError.set(null);
    try {
      await firstValueFrom(
        this.http.post(
          `${environment.apiUrl}/auth/profile/verify-email/request`,
          {},
          { withCredentials: true },
        ),
      );
    } catch (error) {
      this.lastError.set(this.getErrorMessage(error));
      throw error;
    }
  }

  async verifyEmail(token: string): Promise<void> {
    this.lastError.set(null);
    try {
      await firstValueFrom(
        this.http.get(`${environment.apiUrl}/auth/verify-email`, {
          params: { token },
          withCredentials: true,
        }),
      );
      await this.loadSession();
    } catch (error) {
      this.lastError.set(this.getErrorMessage(error));
      throw error;
    }
  }

  async requestPasswordReset(email: string): Promise<void> {
    this.lastError.set(null);
    try {
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/auth/password-reset/request`, { email }),
      );
    } catch (error) {
      this.lastError.set(this.getErrorMessage(error));
      throw error;
    }
  }

  async requestPasswordResetForUser(): Promise<void> {
    this.lastError.set(null);
    try {
      await firstValueFrom(
        this.http.post(
          `${environment.apiUrl}/auth/profile/password-reset/request`,
          {},
          { withCredentials: true },
        ),
      );
    } catch (error) {
      this.lastError.set(this.getErrorMessage(error));
      throw error;
    }
  }

  async updateProfilePicture(picture: File): Promise<void> {
    this.lastError.set(null);
    const formData = new FormData();
    formData.append('picture', picture);

    try {
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/auth/profile/picture`, formData, {
          withCredentials: true,
        }),
      );
      await this.loadSession();
    } catch (error) {
      this.lastError.set(this.getErrorMessage(error));
      throw error;
    }
  }

  async deleteProfile(): Promise<void> {
    this.lastError.set(null);

    const userId = this._user()?.userId;
    try {
      await firstValueFrom(
        this.http.delete(`${environment.apiUrl}/auth/profile`, { withCredentials: true }),
      );
      this._user.set(null);

      if (userId) {
        await this.databaseService.deleteUserDb(userId);
      } else {
        await this.databaseService.initialize();
      }
    } catch (error) {
      this.lastError.set(this.getErrorMessage(error));
      throw error;
    }
  }

  async resetPassword(token: string, password: string): Promise<void> {
    this.lastError.set(null);
    try {
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/auth/password-reset`, { token, password }),
      );
    } catch (error) {
      this.lastError.set(this.getErrorMessage(error));
      throw error;
    }
  }

  async clear(): Promise<void> {
    this._user.set(null);
    this.lastError.set(null);

    await this.databaseService.initialize();
  }

  private getErrorMessage(error: unknown): string {
    const code = error instanceof HttpErrorResponse ? error.error?.error : null;
    const messages: Record<string, string> = {
      invalid_credentials: 'Incorrect email or password.',
      email_not_verified: 'Please verify your email before logging in.',
      rate_limit_exceeded: 'Too many attempts. Please try again later.',
      invalid_email: 'The email is invalid.',
      password_too_short: 'The password must be at least 8 characters long.',
      password_too_long: 'The password cannot exceed 128 characters.',
      email_already_registered: 'This email is already registered.',
      bad_request: 'Please check the entered information.',
      invalid_or_expired_token: 'The link is invalid or has expired.',
      internal_server_error: 'The operation could not be completed. Please try again.',
    };

    return messages[code] ?? 'The operation could not be completed. Please try again.';
  }
}
