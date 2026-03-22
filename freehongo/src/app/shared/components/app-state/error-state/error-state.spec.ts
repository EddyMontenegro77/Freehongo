import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ErrorState } from './error-state';

describe('ErrorState', () => {
  let component: ErrorState;
  let fixture: ComponentFixture<ErrorState>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorState],
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorState);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('title', 'Could not load data');
    fixture.componentRef.setInput('message', 'Please try again.');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render title and message', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Could not load data');
    expect(compiled.textContent).toContain('Please try again.');
  });
});
