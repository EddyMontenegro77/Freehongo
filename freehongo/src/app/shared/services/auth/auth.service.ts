import { Service, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environments';

export interface User {
  name: string;
  email: string;
  verified: boolean;
  pictureUrl?: string | null;
}

@Service()
export class AuthService {
  private http = inject(HttpClient);

  private readonly _user = signal<User | null>(null);
  readonly user = this._user.asReadonly();
  readonly isAuth = computed(() => this._user() !== null);
  readonly lastError = signal<string | null>(null);
  readonly isProcessing = signal(false);

  async loadSession(): Promise<void> {
    try {
      this._user.set(
        await firstValueFrom(
          this.http.get<User>(`${environment.apiUrl}/auth/me`, { withCredentials: true }),
        ),
      );
    } catch {
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

  async signup(name: string, email: string, password: string): Promise<void> {
    this.lastError.set(null);
    this.isProcessing.set(true);
    try {
      await firstValueFrom(
        this.http.post(
          `${environment.apiUrl}/auth/signup`,
          { name, email, password },
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

  async logout(): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/auth/logout`, {}, { withCredentials: true }),
      );
    } finally {
      this._user.set(null);
    }
  }

  clear(): void {
    this._user.set(null);
    this.lastError.set(null);
  }

  private getErrorMessage(error: unknown): string {
    const code = error instanceof HttpErrorResponse ? error.error?.error : null;
    const messages: Record<string, string> = {
      invalid_credentials: 'Email o contraseña incorrectos.',
      invalid_email: 'El email no es válido.',
      password_too_short: 'La contraseña debe tener al menos 8 caracteres.',
      password_too_long: 'La contraseña no puede superar 128 caracteres.',
      email_already_registered: 'Este email ya está registrado.',
      bad_request: 'Revisa los datos ingresados.',
      internal_server_error: 'No se pudo completar la operación. Intenta de nuevo.',
    };

    return messages[code] ?? 'No se pudo completar la operación. Intenta de nuevo.';
  }
}
