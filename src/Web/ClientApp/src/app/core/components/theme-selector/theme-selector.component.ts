import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService, ThemeFamilyId } from '../../services/theme.service';

@Component({
  selector: 'app-theme-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './theme-selector.component.html',
  styleUrls: []
})
export class ThemeSelectorComponent {
  readonly themeService = inject(ThemeService);
  readonly isMenuOpen = signal<boolean>(false);

  readonly families: Array<{ id: ThemeFamilyId; nameAr: string; color: string }> = [
    { id: 'emerald-luxury', nameAr: 'الزمرد الحلبي', color: '#c79c4a' },
    { id: 'royal-heritage', nameAr: 'التراث الملكي', color: '#d97787' },
    { id: 'forest-glass', nameAr: 'غابات الأرز', color: '#52b399' },
    { id: 'executive-premium', nameAr: 'التنفيذي الحديث', color: '#81a1de' },
    { id: 'heritage-luxury', nameAr: 'حجر حلب الذهبي', color: '#ebc37f' },
    { id: 'syrian-identity', nameAr: 'الهوية السورية', color: '#4abd89' },
  ];

  toggleMode(): void {
    this.themeService.toggleTheme();
  }

  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isMenuOpen.update(v => !v);
  }

  selectFamily(familyId: ThemeFamilyId, event: MouseEvent): void {
    event.stopPropagation();
    this.themeService.setFamily(familyId);
    this.isMenuOpen.set(false);
  }
}
