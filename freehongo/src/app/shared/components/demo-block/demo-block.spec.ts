import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DemoBlock } from './demo-block';

describe('DemoBlock', () => {
  let component: DemoBlock;
  let fixture: ComponentFixture<DemoBlock>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DemoBlock]
    })
      .compileComponents();

    fixture = TestBed.createComponent(DemoBlock);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('heading', 'Demo');
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
