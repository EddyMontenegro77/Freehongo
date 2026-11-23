import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Summary } from './summary';

describe('Summary', () => {
  let component: Summary;
  let fixture: ComponentFixture<Summary>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Summary]
    })
      .compileComponents();

    fixture = TestBed.createComponent(Summary);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('data', { masteryLevel: 'new', accuracy: 0, totalSessions: 0, dayStreak: 0, averageResponseTimeMs: 0 });
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
