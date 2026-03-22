import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { ThemeService } from './shared/services/theme/theme.service';

describe('App', () => {
  const themeServiceMock = {
    initTheme: vi.fn(),
    getTheme: vi.fn().mockReturnValue('light'),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [{ provide: ThemeService, useValue: themeServiceMock }],
    }).compileComponents();
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

  it('should render router outlet', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });
});
