import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Tendencies } from './tendencies';

describe('Tendencies', () => {
  let component: Tendencies;
  let fixture: ComponentFixture<Tendencies>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Tendencies]
    })
      .compileComponents();

    fixture = TestBed.createComponent(Tendencies);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
