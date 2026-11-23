import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StylesTest } from './styles-test';

describe('StylesTest', () => {
  let component: StylesTest;
  let fixture: ComponentFixture<StylesTest>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StylesTest]
    })
      .compileComponents();

    fixture = TestBed.createComponent(StylesTest);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
