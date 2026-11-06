import { Component, inject, signal, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FavoriteService } from '../../services/favorite.service';
import { NotificationService } from '../../services/notification.service';
import { ChatService } from '../../services/chat.service';
import { Notification } from '../../models/notification.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls: []
})
export class SidebarComponent {
  readonly authService = inject(AuthService);
  readonly favoriteService = inject(FavoriteService);
  readonly notificationService = inject(NotificationService);
  readonly chatService = inject(ChatService);
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef);

  readonly isMobileOpen = signal<boolean>(false);
  readonly isNotificationDropdownOpen = signal<boolean>(false);

  get roleLabel(): string {
    const role = this.authService.userRole();
    if (role === 'Agent') return 'وكيل عقاري';
    if (role === 'Admin') return 'مدير النظام';
    return 'مشتري';
  }

  toggleMobileMenu(): void {
    this.isMobileOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.isMobileOpen.set(false);
  }

  toggleNotificationDropdown(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    const current = this.isNotificationDropdownOpen();
    this.isNotificationDropdownOpen.set(!current);
    if (!current) {
      this.notificationService.getNotifications().subscribe({ error: () => {} });
    }
  }

  closeNotificationDropdown(): void {
    this.isNotificationDropdownOpen.set(false);
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({ error: () => {} });
  }

  onNotificationClick(notification: Notification): void {
    this.notificationService.markAsRead(notification.id).subscribe({ error: () => {} });
    this.closeNotificationDropdown();
    this.closeMobileMenu();

    if (notification.type === 'InquiryReceived') {
      this.router.navigate(['/my-property-inquiries']);
    } else if (notification.type === 'InquiryStatusUpdated') {
      this.router.navigate(['/inquiries']);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isNotificationDropdownOpen() && !this.elementRef.nativeElement.contains(event.target)) {
      this.closeNotificationDropdown();
    }
  }

  logout(): void {
    this.authService.logout();
    this.closeMobileMenu();
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
