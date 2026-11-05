import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CloudSyncService } from './cloud-sync.service';

describe('CloudSyncService', () => {
  let component: CloudSyncService;
  let fixture: ComponentFixture<CloudSyncService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CloudSyncService]
    })
      .compileComponents();

    fixture = TestBed.createComponent(CloudSyncService);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
