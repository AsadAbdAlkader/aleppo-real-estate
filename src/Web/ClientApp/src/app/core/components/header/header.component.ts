import { Component, inject, signal, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FavoriteService } from '../../services/favorite.service';
import { NotificationService } from '../../services/notification.service';
import { ChatService } from '../../services/chat.service';
import { CurrencyService, CurrencyCode } from '../../services/currency.service';
import { ComparisonService } from '../../services/comparison.service';
import { Notification } from '../../models/notification.model';
import { MortgageCalculatorComponent } from '../../../features/properties/mortgage-calculator/mortgage-calculator.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MortgageCalculatorComponent],
  templateUrl: './header.component.html',
  styleUrls: []
})
export class HeaderComponent {
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
    this.isCurrencyDropdownOpen.update(v => !v);
  }

  selectCurrency(code: CurrencyCode): void {
    this.currencyService.setCurrency(code);
    this.isCurrencyDropdownOpen.set(false);
  }

  openMortgageCalculator(): void {
    this.isMortgageCalculatorOpen.set(true);
  }

  closeMortgageCalculator(): void {
    this.isMortgageCalculatorOpen.set(false);
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({ error: () => {} });
  }

  onNotificationClick(notification: Notification): void {
    this.notificationService.markAsRead(notification.id).subscribe({ error: () => {} });
    this.closeDropdown();

    if (notification.type === 'InquiryReceived') {
      this.router.navigate(['/my-property-inquiries']);
    } else if (notification.type === 'InquiryStatusUpdated') {
      this.router.navigate(['/inquiries']);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isDropdownOpen() && !this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
    if (this.isCurrencyDropdownOpen() && !this.elementRef.nativeElement.contains(event.target)) {
      this.isCurrencyDropdownOpen.set(false);
    }
  }

  logout(): void {
    this.authService.logout();
  }

  formatTime(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays === 1) return 'أمس';
    if (diffDays < 7) return `منذ ${diffDays} أيام`;
    return date.toLocaleDateString('ar-SY', { month: 'short', day: 'numeric' });
  }
}
