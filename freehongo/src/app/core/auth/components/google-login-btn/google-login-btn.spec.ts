import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GoogleLoginBtn } from './google-login-btn';

describe('GoogleLoginBtn', () => {
  let component: GoogleLoginBtn;
  let fixture: ComponentFixture<GoogleLoginBtn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GoogleLoginBtn]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GoogleLoginBtn);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
