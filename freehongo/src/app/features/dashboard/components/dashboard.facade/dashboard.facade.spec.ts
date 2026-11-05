import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardFacade } from './dashboard.facade';

describe('DashboardFacade', () => {
  let component: DashboardFacade;
  let fixture: ComponentFixture<DashboardFacade>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardFacade]
    })
      .compileComponents();

    fixture = TestBed.createComponent(DashboardFacade);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
