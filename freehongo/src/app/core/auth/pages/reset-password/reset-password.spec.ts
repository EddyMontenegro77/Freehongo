import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { AuthService } from '../../../../shared/services/auth/auth.service';

import { ResetPassword } from './reset-password';

describe('ResetPassword', () => {
  let fixture: ComponentFixture<ResetPassword>;
  let component: ResetPassword;
  let token: string | null;

  const authMock = {
    lastError: signal<string | null>(null),
    resetPassword: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    token = 'reset-token';
    authMock.lastError.set(null);
    authMock.resetPassword.mockReset();
    authMock.resetPassword.mockResolvedValue(undefined);

    await TestBed.configureTestingModule({
      imports: [ResetPassword],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => token } } },
        },
        { provide: AuthService, useValue: authMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResetPassword);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should reject a reset request when the recovery token is missing', async () => {
    token = null;
    fixture = TestBed.createComponent(ResetPassword);
    component = fixture.componentInstance;

    await component.submit();

    expect(authMock.resetPassword).not.toHaveBeenCalled();
    expect(component.message()).toBe('The recovery link is invalid.');
  });

  it('should reject passwords that do not match', async () => {
    component.resetModel.set({ password: 'password123', confirmation: 'different123' });

    await component.submit();

    expect(authMock.resetPassword).not.toHaveBeenCalled();
    expect(component.message()).toBe('Passwords do not match.');
  });

  it('should update the password and navigate to login on success', async () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    component.resetModel.set({ password: 'password123', confirmation: 'password123' });

    await component.submit();

    expect(authMock.resetPassword).toHaveBeenCalledWith('reset-token', 'password123');
    expect(component.message()).toBe('Password updated. You can now log in.');
    expect(component.isProcessing()).toBe(false);
    expect(navigate).toHaveBeenCalledWith('/auth/login');
  });

  it('should show the service error when updating the password fails', async () => {
    authMock.lastError.set('The link is invalid or has expired.');
    authMock.resetPassword.mockRejectedValue(new Error('expired token'));
    component.resetModel.set({ password: 'password123', confirmation: 'password123' });

    await component.submit();

    expect(component.message()).toBe('The link is invalid or has expired.');
    expect(component.isProcessing()).toBe(false);
  });
});
