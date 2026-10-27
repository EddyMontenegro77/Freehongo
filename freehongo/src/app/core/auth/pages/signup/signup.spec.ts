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
    component.username.set('User');
    component.userEmail.set('user@example.com');
    component.password.set('password123');
    component.passwordConfirmation.set('different123');

    await component.submitUser();

    expect(authMock.signup).not.toHaveBeenCalled();
    expect(authMock.lastError()).toBe('Las contraseñas no coinciden.');
  });

  it('navigates after a successful signup', async () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    component.username.set('User');
    component.userEmail.set('user@example.com');
    component.password.set('password123');
    component.passwordConfirmation.set('password123');

    await component.submitUser();

    expect(authMock.signup).toHaveBeenCalledWith('User', 'user@example.com', 'password123');
    expect(navigate).toHaveBeenCalledWith('/');
  });
});
