import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    document.documentElement.removeAttribute('data-theme');
    TestBed.configureTestingModule({
      providers: [ThemeService]
    });
    service = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.remove('theme-transitioning');
    document.documentElement.removeAttribute('data-theme');
  });

  it('should initialize with light or system theme by default', () => {
    expect(service).toBeTruthy();
    expect(['light', 'dark']).toContain(service.theme());
    expect(service.themeFamily()).toBe('emerald-luxury');
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

  it('should apply dark class and data-theme to document.documentElement when dark is set', () => {
    service.setTheme('dark');
    TestBed.flushEffects();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('emerald-luxury-dark');

    service.setTheme('light');
    TestBed.flushEffects();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.getAttribute('data-theme')).toBe('emerald-luxury-light');
  });

  it('should update theme family and activeThemeId', () => {
    service.setFamily('royal-heritage');
    expect(service.themeFamily()).toBe('royal-heritage');
    expect(service.activeThemeId()).toBe('royal-heritage-light');

    service.setTheme('dark');
    TestBed.flushEffects();
    expect(service.activeThemeId()).toBe('royal-heritage-dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('royal-heritage-dark');
  });

  it('should switch theme by specific id using setThemeById', () => {
    service.setThemeById('syrian-identity-dark');
    TestBed.flushEffects();
    expect(service.themeFamily()).toBe('syrian-identity');
    expect(service.themeMode()).toBe('dark');
    expect(service.isDark()).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('syrian-identity-dark');
  });

  it('should apply theme-transitioning class during theme changes', () => {
    service.setTheme('dark');
    expect(document.documentElement.classList.contains('theme-transitioning')).toBe(true);
  });
});
