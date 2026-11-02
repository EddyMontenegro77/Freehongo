import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { AuthService } from '../../../../shared/services/auth/auth.service';

import { Signup } from './signup';

describe('Signup', () => {
  let component: Signup;
  let fixture: ComponentFixture<Signup>;
  const authMock = {
    isAuth: signal(false).asReadonly(),
    lastError: signal<string | null>(null),
    isProcessing: signal(false).asReadonly(),
    signup: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Signup]
      ,providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => null } } } },
        { provide: AuthService, useValue: authMock },
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Signup);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not submit when passwords do not match', async () => {
    component.signUpModel.set({
      name: 'User',
      email: 'user@example.com',
      password: 'password123',
      passwordConfirmation: 'different123',
    });

    await component.submitUser();

    expect(authMock.signup).not.toHaveBeenCalled();
    expect(authMock.lastError()).toBe('Passwords do not match.');
  });

  it('navigates after a successful signup', async () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    component.signUpModel.set({
      name: 'User',
      email: 'user@example.com',
      password: 'password123',
      passwordConfirmation: 'password123',
    });

    await component.submitUser();

    expect(authMock.signup).toHaveBeenCalledWith({
      name: 'User',
      email: 'user@example.com',
      password: 'password123',
      picture: undefined,
    });
    expect(navigate).toHaveBeenCalledWith(
      '/auth/verify-email?pending=true&email=user%40example.com',
    );
  });
});
