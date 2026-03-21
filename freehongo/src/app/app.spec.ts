import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { ThemeService } from './shared/services/theme/theme.service';
import { CanvasWritingFacadeService } from './features/writing/services/canvas-writing.facade.service';
import { of } from 'rxjs';

describe('App', () => {
  const themeServiceMock = {
    initTheme: vi.fn(),
    getTheme: vi.fn().mockReturnValue('light'),
  };
  const canvasWritingFacadeServiceMock = {
    loadExpectedCharacter: vi.fn().mockReturnValue(
      of({ character: { strokes: [] } as never, expectedUrl: '' }),
    ),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: ThemeService, useValue: themeServiceMock },
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
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
    expect(themeServiceMock.initTheme).toHaveBeenCalledTimes(1);
  });

  it('should initialize theme on app creation', () => {
    TestBed.createComponent(App);
    expect(themeServiceMock.initTheme).toHaveBeenCalledTimes(1);
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-writing-practice')).toBeTruthy();
  });
});
