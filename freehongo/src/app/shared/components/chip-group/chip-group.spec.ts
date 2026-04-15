import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChipGroup } from './chip-group';

describe('ChipGroup', () => {
  let component: ChipGroup;
  let fixture: ComponentFixture<ChipGroup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChipGroup],
    }).compileComponents();

    fixture = TestBed.createComponent(ChipGroup);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('title', 'Test');
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Test');
  });
});
