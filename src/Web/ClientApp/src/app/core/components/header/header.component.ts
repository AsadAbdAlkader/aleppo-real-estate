import { Component, inject, signal, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FavoriteService } from '../../services/favorite.service';
import { NotificationService } from '../../services/notification.service';
import { ChatService } from '../../services/chat.service';
import { CurrencyService, CurrencyCode } from '../../services/currency.service';
import { ComparisonService } from '../../services/comparison.service';
import { ThemeService } from '../../services/theme.service';
import { Notification } from '../../models/notification.model';
import { MortgageCalculatorComponent } from '../../../features/properties/mortgage-calculator/mortgage-calculator.component';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { Permissions } from '../../auth/permissions';
import { ThemeSelectorComponent } from '../theme-selector/theme-selector.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MortgageCalculatorComponent, HasPermissionDirective, ThemeSelectorComponent],
  templateUrl: './header.component.html',
  styleUrls: []
})
export class HeaderComponent {
  readonly permissions = Permissions;
  readonly themeService = inject(ThemeService);
  readonly authService = inject(AuthService);
  readonly favoriteService = inject(FavoriteService);
  readonly notificationService = inject(NotificationService);
  readonly chatService = inject(ChatService);
  readonly currencyService = inject(CurrencyService);
  readonly comparisonService = inject(ComparisonService);
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef);

  readonly isDropdownOpen = signal<boolean>(false);
  readonly isCurrencyDropdownOpen = signal<boolean>(false);
  readonly isMortgageCalculatorOpen = signal<boolean>(false);

  get roleLabel(): string {
    const role = this.authService.userRole();
    if (role === 'Agent') return 'وكيل عقاري';
    if (role === 'Admin') return 'مدير النظام';
    return 'مشتري';
  }

  toggleDropdown(): void {
    const current = this.isDropdownOpen();
    this.isDropdownOpen.set(!current);
    if (!current) {
      this.notificationService.getNotifications().subscribe({ error: () => {} });
    }
  }

  closeDropdown(): void {
    this.isDropdownOpen.set(false);
  }

  toggleCurrencyDropdown(): void {
    const current = this.isCurrencyDropdownOpen();
    this.isCurrencyDropdownOpen.set(!current);
  }

  closeCurrencyDropdown(): void {
    this.isCurrencyDropdownOpen.set(false);
  }

  selectCurrency(code: CurrencyCode): void {
    this.currencyService.setCurrency(code);
    this.closeCurrencyDropdown();
  }

  openMortgageCalculator(): void {
    this.isMortgageCalculatorOpen.set(true);
  }

  closeMortgageCalculator(): void {
    this.isMortgageCalculatorOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
      this.closeCurrencyDropdown();
    }
  }

  logout(): void {
    this.authService.logout();
  }

  formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays === 1) return 'أمس';
    return `منذ ${diffDays} يوم`;
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({ error: () => {} });
  }

  onNotificationClick(notification: Notification): void {
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id).subscribe({ error: () => {} });
    }
    this.closeDropdown();

    if (notification.type === 'Inquiry' || notification.type === 'NewInquiry' || notification.type === 'InquiryReceived') {
      this.router.navigate(['/my-property-inquiries']);
    } else if (notification.type === 'TourBooking') {
      this.router.navigate(['/my-property-inquiries']);
    } else if (notification.type === 'ChatMessage' && notification.referenceId) {
      this.router.navigate(['/messages'], { queryParams: { conversationId: notification.referenceId } });
    } else {
      this.router.navigate(['/inquiries']);
    }
  }
}
