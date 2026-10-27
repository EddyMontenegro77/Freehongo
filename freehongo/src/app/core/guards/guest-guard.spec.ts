import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router, provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { guestGuard } from './guest-guard';
import { AuthService } from '../../shared/services/auth/auth.service';

describe('guestGuard', () => {
  const authServiceMock = {
    isAuth: vi.fn(),
  };

  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => guestGuard(...guardParameters));

  let router: Router;

  beforeEach(() => {
    vi.resetAllMocks();

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
      ],
    });

    router = TestBed.inject(Router);
  });

  it('debería permitir el acceso si el usuario no está autenticado', () => {
    authServiceMock.isAuth.mockReturnValue(false);

    const result = executeGuard({} as never, {} as never);

    expect(result).toBe(true);
  });

  it('debería redirigir al dashboard si el usuario está autenticado', () => {
    authServiceMock.isAuth.mockReturnValue(true);

    const result = executeGuard({} as never, {} as never);

    expect(result).toEqual(router.createUrlTree(['/']));
  });
});
