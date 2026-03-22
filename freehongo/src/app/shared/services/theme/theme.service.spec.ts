import { TestBed } from '@angular/core/testing';
import { ThemeService, ThemeMode } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  const setPreferredTheme = (isDark: boolean) => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
      matches: isDark,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    } as MediaQueryList));
  };

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    vi.unstubAllGlobals();

    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('initTheme should use preferred theme when nothing is stored', () => {
    setPreferredTheme(true);

    const theme = service.initTheme();

    expect(theme).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('initTheme should use saved theme over preferred theme', () => {
    localStorage.setItem('freehongo-theme', 'light');
    setPreferredTheme(true);

    const theme = service.initTheme();

    expect(theme).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('setTheme should persist and apply the theme', () => {
    service.setTheme('dark');

    expect(localStorage.getItem('freehongo-theme')).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('toggleTheme should switch from light to dark', () => {
    localStorage.setItem('freehongo-theme', 'light');
    setPreferredTheme(false);

    const theme: ThemeMode = service.toggleTheme();

    expect(theme).toBe('dark');
    expect(localStorage.getItem('freehongo-theme')).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
