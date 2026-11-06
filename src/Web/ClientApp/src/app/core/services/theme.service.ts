import { Injectable, signal, computed, effect } from '@angular/core';
import {
  DEFAULT_DARK_THEME,
  DEFAULT_LIGHT_THEME,
  DEFAULT_THEME_FAMILY,
  getThemeDefinition,
  resolveThemeId,
  ThemeDefinition,
  ThemeFamilyId,
  ThemeId,
  ThemeMode,
  THEMES_REGISTRY
} from '../constants/themes.const';

export type { ThemeMode, ThemeFamilyId, ThemeId, ThemeDefinition };

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY_MODE = 'aleppo_theme';
  private readonly STORAGE_KEY_FAMILY = 'aleppo_theme_family';
  private readonly STORAGE_KEY_ID = 'aleppo_theme_id';

  private transitionTimer: any = null;

  // Primary reactive state
  readonly themeMode = signal<ThemeMode>(this.getInitialMode());
  readonly themeFamily = signal<ThemeFamilyId>(this.getInitialFamily());

  // Backward-compatible alias for existing components & tests
  readonly theme = this.themeMode;

  readonly isDark = computed(() => this.themeMode() === 'dark');

  readonly activeThemeId = computed<ThemeId>(() =>
    resolveThemeId(this.themeFamily(), this.themeMode())
  );

  readonly activeThemeDefinition = computed<ThemeDefinition>(() =>
    getThemeDefinition(this.activeThemeId())
  );

  readonly availableThemes = Object.values(THEMES_REGISTRY);

  constructor() {
    // Automatically apply theme tokens and dark classes to DOM whenever signals change
    effect(() => {
      const mode = this.themeMode();
      const themeId = this.activeThemeId();
      this.applyThemeToDOM(mode, themeId);
    });
  }

  toggleTheme(): void {
    const nextMode: ThemeMode = this.themeMode() === 'dark' ? 'light' : 'dark';
    this.setTheme(nextMode);
  }

  setTheme(mode: ThemeMode): void {
    this.triggerTransition();
    this.themeMode.set(mode);
    this.persist();
  }

  setFamily(family: ThemeFamilyId): void {
    this.triggerTransition();
    this.themeFamily.set(family);
    this.persist();
  }

  setThemeById(themeId: ThemeId): void {
    const def = THEMES_REGISTRY[themeId];
    if (!def) return;
    this.triggerTransition();
    this.themeFamily.set(def.family);
    this.themeMode.set(def.mode);
    this.persist();
  }

  private triggerTransition(): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    root.classList.add('theme-transitioning');

    if (this.transitionTimer) {
      clearTimeout(this.transitionTimer);
    }

    this.transitionTimer = setTimeout(() => {
      root.classList.remove('theme-transitioning');
      this.transitionTimer = null;
    }, 450);
  }

  private applyThemeToDOM(mode: ThemeMode, themeId: ThemeId): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;

    // Apply data-theme attribute
    root.setAttribute('data-theme', themeId);

    // Apply dark class and colorScheme
    if (mode === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }

  private persist(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const mode = this.themeMode();
    const family = this.themeFamily();
    const themeId = this.activeThemeId();

    localStorage.setItem(this.STORAGE_KEY_MODE, mode);
    localStorage.setItem(this.STORAGE_KEY_FAMILY, family);
    localStorage.setItem(this.STORAGE_KEY_ID, themeId);
  }

  private getInitialMode(): ThemeMode {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(this.STORAGE_KEY_MODE) as ThemeMode | null;
      if (stored === 'dark' || stored === 'light') {
        return stored;
      }

      // Check system color scheme preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
  }

  private getInitialFamily(): ThemeFamilyId {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedFamily = localStorage.getItem(this.STORAGE_KEY_FAMILY) as ThemeFamilyId | null;
      if (storedFamily && [
        'emerald-luxury',
        'royal-heritage',
        'forest-glass',
        'executive-premium',
        'heritage-luxury',
        'syrian-identity'
      ].includes(storedFamily)) {
        return storedFamily;
      }
    }
    return DEFAULT_THEME_FAMILY;
  }
}
