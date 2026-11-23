import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WeakChars } from './weak-chars';

describe('WeakChars', () => {
  let component: WeakChars;
  let fixture: ComponentFixture<WeakChars>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeakChars]
    })
      .compileComponents();

    fixture = TestBed.createComponent(WeakChars);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('data', []);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
