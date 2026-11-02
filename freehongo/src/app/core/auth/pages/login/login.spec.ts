import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { AuthService } from '../../../../shared/services/auth/auth.service';

import { Login } from './login';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  const authMock = {
    isAuth: signal(false).asReadonly(),
    lastError: signal<string | null>(null),
    isProcessing: signal(false).asReadonly(),
    login: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    authMock.login.mockClear();
    await TestBed.configureTestingModule({
      imports: [Login]
      ,providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => null } } } },
        { provide: AuthService, useValue: authMock },
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('navigates to the return url after a successful login', async () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    component.loginModel.set({ email: 'user@example.com', password: 'password123' });

    await component.submitUser();

    expect(authMock.login).toHaveBeenCalledWith('user@example.com', 'password123');
    expect(navigate).toHaveBeenCalledWith('/');
  });

  it('redirects unverified users to the verification page', async () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    authMock.login.mockRejectedValueOnce(
      new HttpErrorResponse({ status: 403, error: { error: 'email_not_verified' } }),
    );
    component.loginModel.set({ email: 'user@example.com', password: 'password123' });

    await component.submitUser();

    expect(navigate).toHaveBeenCalledWith(
      '/auth/verify-email?pending=true&email=user%40example.com',
    );
  });
});
