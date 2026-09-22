import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavigationBtn } from './navigation-btn';

describe('NavigationBtn', () => {
  let component: NavigationBtn;
  let fixture: ComponentFixture<NavigationBtn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavigationBtn]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavigationBtn);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
