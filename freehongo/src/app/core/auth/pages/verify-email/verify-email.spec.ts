import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { AuthService } from '../../../../shared/services/auth/auth.service';

import { VerifyEmail } from './verify-email';

describe('VerifyEmail', () => {
  let fixture: ComponentFixture<VerifyEmail>;
  let component: VerifyEmail;
  let token: string | null;

  const authMock = {
    lastError: signal<string | null>(null),
    verifyEmail: vi.fn().mockResolvedValue(undefined),
    requestEmailVerification: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    token = 'verification-token';
    authMock.lastError.set(null);
    authMock.verifyEmail.mockReset();
    authMock.verifyEmail.mockResolvedValue(undefined);

    await TestBed.configureTestingModule({
      imports: [VerifyEmail],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => token } } },
        },
        { provide: AuthService, useValue: authMock },
      ],
    }).compileComponents();
  });

  const createFixture = (): void => {
    fixture = TestBed.createComponent(VerifyEmail);
    component = fixture.componentInstance;
  };

  it('should create', () => {
    createFixture();
    expect(component).toBeTruthy();
  });

  it('should show the pending verification state without a token', async () => {
    token = null;
    createFixture();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(authMock.verifyEmail).not.toHaveBeenCalled();
    expect(component.isProcessing()).toBe(false);
    expect(component.isPending()).toBe(false);
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent.trim()).toBe(
      'The verification link is invalid.',
    );
  });

  it('should verify the token and navigate home on success', async () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    createFixture();

    await fixture.whenStable();
    fixture.detectChanges();

    expect(authMock.verifyEmail).toHaveBeenCalledWith('verification-token');
    expect(component.message()).toBe('Your email was verified successfully.');
    expect(component.isProcessing()).toBe(false);
    expect(navigate).toHaveBeenCalledWith('/');
  });

  it('should show the service error when verification fails', async () => {
    authMock.lastError.set('The link is invalid or has expired.');
    authMock.verifyEmail.mockRejectedValue(new Error('invalid token'));

    createFixture();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.isProcessing()).toBe(false);
    expect(component.error()).toBe('The link is invalid or has expired.');
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent.trim()).toBe(
      'The link is invalid or has expired.',
    );
  });

  it('should navigate to login from the error action', async () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    createFixture();

    await component.goToLogin();

    expect(navigate).toHaveBeenCalledWith('/auth/login');
  });
});
