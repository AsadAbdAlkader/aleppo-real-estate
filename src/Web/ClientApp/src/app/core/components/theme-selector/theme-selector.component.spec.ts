import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ThemeSelectorComponent } from './theme-selector.component';
import { ThemeService } from '../../services/theme.service';

describe('ThemeSelectorComponent', () => {
  let component: ThemeSelectorComponent;
  let fixture: ComponentFixture<ThemeSelectorComponent>;
  let themeService: ThemeService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [ThemeSelectorComponent],
      providers: [ThemeService]
    }).compileComponents();

    fixture = TestBed.createComponent(ThemeSelectorComponent);
    component = fixture.componentInstance;
    themeService = TestBed.inject(ThemeService);
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create and render theme toggle button', () => {
    expect(component).toBeTruthy();
    expect(component.families.length).toBe(6);
  });

  it('should toggle theme mode on button click', () => {
    themeService.setTheme('light');
    expect(themeService.isDark()).toBe(false);

    component.toggleMode();
    expect(themeService.isDark()).toBe(true);

    component.toggleMode();
    expect(themeService.isDark()).toBe(false);
  });

  it('should toggle menu open state', () => {
    expect(component.isMenuOpen()).toBe(false);
    const mockEvent = { stopPropagation: () => {} } as unknown as MouseEvent;
    component.toggleMenu(mockEvent);
    expect(component.isMenuOpen()).toBe(true);

    component.toggleMenu(mockEvent);
    expect(component.isMenuOpen()).toBe(false);
  });

  it('should select theme family and close menu', () => {
    const mockEvent = { stopPropagation: () => {} } as unknown as MouseEvent;
    component.isMenuOpen.set(true);

    component.selectFamily('royal-heritage', mockEvent);
    expect(themeService.themeFamily()).toBe('royal-heritage');
    expect(component.isMenuOpen()).toBe(false);
  });
});
