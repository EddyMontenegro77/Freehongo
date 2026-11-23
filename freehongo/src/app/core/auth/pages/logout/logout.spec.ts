import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Logout } from './logout';
import { AuthService } from '../../../../shared/services/auth/auth.service';
import { Router } from '@angular/router';

describe('Logout', () => {
  let component: Logout;
  let fixture: ComponentFixture<Logout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Logout],
      providers: [
        { provide: AuthService, useValue: { logout: vi.fn().mockResolvedValue(undefined) } },
        { provide: Router, useValue: { navigate: vi.fn().mockResolvedValue(true) } },
      ],
    })
      .compileComponents();

    fixture = TestBed.createComponent(Logout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
