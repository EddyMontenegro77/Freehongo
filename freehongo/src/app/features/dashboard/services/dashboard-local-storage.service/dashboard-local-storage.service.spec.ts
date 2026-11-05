import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardLocalStorageService } from './dashboard-local-storage.service';

describe('DashboardLocalStorageService', () => {
  let component: DashboardLocalStorageService;
  let fixture: ComponentFixture<DashboardLocalStorageService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardLocalStorageService]
    })
      .compileComponents();

    fixture = TestBed.createComponent(DashboardLocalStorageService);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
