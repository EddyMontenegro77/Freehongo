import { TestBed } from '@angular/core/testing';
import { HttpHeaders, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environments';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('loads the current user with session credentials', async () => {
    const promise = service.loadSession();
    const request = httpMock.expectOne(`${environment.apiUrl}/auth/me`);

    expect(request.request.withCredentials).toBe(true);
    request.flush({ name: 'User', email: 'user@example.com', verified: true });
    await promise;

    expect(service.user()).toEqual({
      name: 'User',
      email: 'user@example.com',
      verified: true,
    });
    expect(service.isAuth()).toBe(true);
  });

  it('clears the user when there is no active session', async () => {
    const promise = service.loadSession();
    const request = httpMock.expectOne(`${environment.apiUrl}/auth/me`);
    request.flush({ error: 'unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    await promise;

    expect(service.user()).toBeNull();
    expect(service.isAuth()).toBe(false);
  });

  it('logs in and loads the resulting user', async () => {
    const promise = service.login('user@example.com', 'password123');
    const loginRequest = httpMock.expectOne(`${environment.apiUrl}/auth/login`);

    expect(loginRequest.request.body).toEqual({
      email: 'user@example.com',
      password: 'password123',
    });
    expect(loginRequest.request.withCredentials).toBe(true);
    loginRequest.flush({ expiresAt: '2030-01-01T00:00:00Z' });
    await Promise.resolve();

    const sessionRequest = httpMock.expectOne(`${environment.apiUrl}/auth/me`);
    sessionRequest.flush({ name: 'User', email: 'user@example.com', verified: false });
    await promise;

    expect(service.isAuth()).toBe(true);
    expect(service.lastError()).toBeNull();
  });

  it('exposes a backend login error and does not authenticate', async () => {
    const promise = service.login('user@example.com', 'wrong');
    const request = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    request.flush({ error: 'invalid_credentials' }, { status: 401, statusText: 'Unauthorized' });

    await expect(promise).rejects.toBeTruthy();
    expect(service.lastError()).toBe('Incorrect email or password.');
    expect(service.isProcessing()).toBe(false);
  });

  it('shows a specific message when login is rate limited', async () => {
    const promise = service.login('user@example.com', 'wrong');
    const request = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    request.flush(
      { error: 'rate_limit_exceeded' },
      { status: 429, statusText: 'Too Many Requests', headers: new HttpHeaders({ 'Retry-After': '60' }) },
    );

    await expect(promise).rejects.toBeTruthy();
    expect(service.lastError()).toBe('Too many attempts. Please try again later.');
  });

  it('signs up with name, email and password', async () => {
    const promise = service.signup({ name: 'User', email: 'user@example.com', password: 'password123' });
    const signupRequest = httpMock.expectOne(`${environment.apiUrl}/auth/signup`);

    expect(signupRequest.request.body).toEqual({
      name: 'User',
      email: 'user@example.com',
      password: 'password123',
    });
    signupRequest.flush({ expiresAt: '2030-01-01T00:00:00Z' });
    await Promise.resolve();

    const sessionRequest = httpMock.expectOne(`${environment.apiUrl}/auth/me`);
    sessionRequest.flush({ name: 'User', email: 'user@example.com', verified: false });
    await promise;

    expect(service.user()?.name).toBe('User');
  });

  it('sends signup data as multipart when a picture is provided', async () => {
    const picture = new File(['image'], 'avatar.png', { type: 'image/png' });
    const promise = service.signup({
      name: 'User',
      email: 'user@example.com',
      password: 'password123',
      picture,
    });
    const signupRequest = httpMock.expectOne(`${environment.apiUrl}/auth/signup`);
    expect(signupRequest.request.body).toBeInstanceOf(FormData);
    expect((signupRequest.request.body as FormData).get('picture')).toBe(picture);
    signupRequest.flush({ expiresAt: '2030-01-01T00:00:00Z' });
    await Promise.resolve();

    const sessionRequest = httpMock.expectOne(`${environment.apiUrl}/auth/me`);
    sessionRequest.flush({ name: 'User', email: 'user@example.com', verified: false });
    await promise;
  });

  it('requests a password reset with the entered email', async () => {
    const promise = service.requestPasswordReset('user@example.com');
    const request = httpMock.expectOne(`${environment.apiUrl}/auth/password-reset/request`);
    expect(request.request.body).toEqual({ email: 'user@example.com' });
    request.flush({ message: 'password_reset_email_sent' });
    await promise;
  });

  it('logs out and clears the local user', async () => {
    const promise = service.logout();
    const request = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);

    expect(request.request.withCredentials).toBe(true);
    request.flush(null);
    await promise;

    expect(service.user()).toBeNull();
  });
});
