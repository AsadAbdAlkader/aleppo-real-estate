import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    TestBed.configureTestingModule({
      providers: [ThemeService]
    });
    service = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('should initialize with light or system theme by default', () => {
    expect(service).toBeTruthy();
    expect(['light', 'dark']).toContain(service.theme());
  });

  it('should toggle theme from light to dark and back', () => {
    service.setTheme('light');
    expect(service.theme()).toBe('light');
    expect(service.isDark()).toBe(false);

    service.toggleTheme();
    expect(service.theme()).toBe('dark');
    expect(service.isDark()).toBe(true);
    expect(localStorage.getItem('aleppo_theme')).toBe('dark');

    service.toggleTheme();
    expect(service.theme()).toBe('light');
    expect(service.isDark()).toBe(false);
    expect(localStorage.getItem('aleppo_theme')).toBe('light');
  });

  it('should apply dark class to document.documentElement when dark is set', () => {
    service.setTheme('dark');
    TestBed.flushEffects();
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    service.setTheme('light');
    TestBed.flushEffects();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
