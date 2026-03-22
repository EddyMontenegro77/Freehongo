import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { WritingPractice } from './writing-practice';
import { CanvasWritingFacadeService } from '../../services/canvas-writing.facade.service';

describe('WritingPractice', () => {
  let component: WritingPractice;
  let fixture: ComponentFixture<WritingPractice>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  const canvasWritingFacadeServiceMock = {
    loadExpectedCharacter: vi
      .fn()
      .mockReturnValue(of({ character: { strokes: [] } as never, expectedUrl: '' })),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await TestBed.configureTestingModule({
      imports: [WritingPractice],
      providers: [
        { provide: CanvasWritingFacadeService, useValue: canvasWritingFacadeServiceMock },
      ],
    }).compileComponents();

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      canvas: { width: 256, height: 256 },
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      clearRect: vi.fn(),
      getImageData: vi.fn().mockReturnValue({} as never),
      putImageData: vi.fn(),
      fillStyle: 'black',
      lineWidth: 4,
      lineCap: 'round',
      lineJoin: 'round',
    } as never);

    fixture = TestBed.createComponent(WritingPractice);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('width', 256);
    fixture.componentRef.setInput('height', 256);
    fixture.componentRef.setInput('unicode', '3042');
    fixture.componentRef.setInput('type', 'kana');
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render writing canvas wrapper', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-writing-canvas')).toBeTruthy();
  });

  it('should render error state when loading fails', async () => {
    canvasWritingFacadeServiceMock.loadExpectedCharacter.mockReturnValueOnce(
      throwError(() => new Error('failed to load')),
    );

    fixture = TestBed.createComponent(WritingPractice);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('width', 256);
    fixture.componentRef.setInput('height', 256);
    fixture.componentRef.setInput('unicode', '3042');
    fixture.componentRef.setInput('type', 'kana');
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('app-error-state')).toBeTruthy();
    expect(compiled.textContent).toContain('Could not load practice');
  });
});
