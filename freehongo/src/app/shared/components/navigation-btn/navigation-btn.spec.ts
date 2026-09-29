import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavigationBtn } from './navigation-btn';
import { Router } from '@angular/router';

describe('NavigationBtn', () => {
  let component: NavigationBtn;
  let fixture: ComponentFixture<NavigationBtn>;
  const router = {
    navigate: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavigationBtn],
      providers: [{ provide: Router, useValue: router }],
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavigationBtn);
    fixture.componentRef.setInput('title', 'Navigate');
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
