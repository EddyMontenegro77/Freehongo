import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WritingValidation } from './writing-validation';
import { ThemeService } from '../../../../shared/services/theme/theme.service';

describe('WritingValidation', () => {
  let component: WritingValidation;
  let fixture: ComponentFixture<WritingValidation>;

  const themeServiceMock = {
    getTheme: vi.fn().mockReturnValue('light'),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WritingValidation],
      providers: [{ provide: ThemeService, useValue: themeServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(WritingValidation);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('expectedUrl', '');
    fixture.componentRef.setInput('hasValidationResults', false);
    fixture.componentRef.setInput('isValidSequence', false);
    fixture.componentRef.setInput('sequenceError', '');
    fixture.componentRef.setInput('strokeResults', []);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render invalid sequence message and table rows', async () => {
    fixture.componentRef.setInput('hasValidationResults', true);
    fixture.componentRef.setInput('sequenceError', 'Stroke order is incorrect');
    fixture.componentRef.setInput('strokeResults', [
      {
        strokeIndex: 0,
        isValid: false,
        inputStroke: { getPoints: () => [] } as never,
        expectedStroke: { getPoints: () => [] } as never,
        errorType: 'wrong-order',
      },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Sequence is not valid');
    expect(compiled.textContent).toContain('Stroke order is incorrect');
    expect(compiled.textContent).toContain('Stroke');
  });
});
