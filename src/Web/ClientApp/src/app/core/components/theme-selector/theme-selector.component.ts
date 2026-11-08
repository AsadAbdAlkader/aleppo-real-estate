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
    { id: 'syrian-identity', nameAr: 'الهوية السورية (جامعة الشمل)', color: '#054239' },
    { id: 'emerald-luxury', nameAr: 'الزمرد الحلبي الفاخر', color: '#c79c4a' },
    { id: 'royal-heritage', nameAr: 'التراث الملكي الدمشقي', color: '#6b1f2a' },
    { id: 'forest-glass', nameAr: 'غابات الأرز والزجاج', color: '#428177' },
    { id: 'executive-premium', nameAr: 'المكتب التنفيذي الحديث', color: '#1c2b4b' },
    { id: 'heritage-luxury', nameAr: 'حجر حلب والقمح الذهبي', color: '#b9a779' },
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
