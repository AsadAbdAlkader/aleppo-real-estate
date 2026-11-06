import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HeaderComponent } from './header.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FavoriteService } from '../../services/favorite.service';
import { NotificationService } from '../../services/notification.service';
import { Notification } from '../../models/notification.model';
import { of } from 'rxjs';
import { signal, WritableSignal } from '@angular/core';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let router: Router;

  let mockAuthService: {
    isAuthenticated: WritableSignal<boolean>;
    currentUser: WritableSignal<any>;
    userRole: WritableSignal<string | null>;
    logout: any;
  };

  let mockFavoriteService: {
    favoritesCount: WritableSignal<number>;
  };

  let mockNotificationService: {
    unreadCount: WritableSignal<number>;
    notifications: WritableSignal<Notification[]>;
    loading: WritableSignal<boolean>;
    getNotifications: any;
    getUnreadCount: any;
    markAsRead: any;
    markAllAsRead: any;
  };

  beforeEach(async () => {
    mockAuthService = {
      isAuthenticated: signal(true),
      currentUser: signal({ id: 'user-1', firstName: 'أحمد', lastName: 'الحلبي', role: 'Agent' }),
      userRole: signal('Agent'),
      logout: vi.fn()
    };

    mockFavoriteService = {
      favoritesCount: signal(2)
    };

    mockNotificationService = {
      unreadCount: signal(2),
      notifications: signal([
        {
          id: 'notif-1',
          title: 'استفسار جديد على عقارك',
          message: 'لديك استفسار جديد حول عقارك شقة فاخرة للبيع.',
          type: 'InquiryReceived',
          referenceId: 'inq-1',
          isRead: false,
          createdAt: '2026-09-28T12:00:00Z'
        },
        {
          id: 'notif-2',
          title: 'تحديث حالة الاستفسار',
          message: 'تم تحديث حالة استفسارك.',
          type: 'InquiryStatusUpdated',
          referenceId: 'inq-2',
          isRead: false,
          createdAt: '2026-09-28T10:00:00Z'
        }
      ]),
      loading: signal(false),
      getNotifications: vi.fn().mockReturnValue(of({ items: [], totalCount: 0, pageNumber: 1, pageSize: 10, totalPages: 1 })),
      getUnreadCount: vi.fn().mockReturnValue(of({ unreadCount: 2 })),
      markAsRead: vi.fn().mockReturnValue(of(undefined)),
      markAllAsRead: vi.fn().mockReturnValue(of(undefined))
    };

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: FavoriteService, useValue: mockFavoriteService },
        { provide: NotificationService, useValue: mockNotificationService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create HeaderComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle dropdown and fetch notifications when toggleDropdown is called', () => {
    expect(component.isDropdownOpen()).toBe(false);

    component.toggleDropdown();

    expect(component.isDropdownOpen()).toBe(true);
    expect(mockNotificationService.getNotifications).toHaveBeenCalled();
  });

  it('should render unread count badge when authenticated and unreadCount > 0', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const badge = compiled.querySelector('button[title="الإشعارات"] span');
    expect(badge).toBeTruthy();
    expect(badge?.textContent?.trim()).toBe('2');
  });

  it('should call markAllAsRead on NotificationService when markAllAsRead is executed', () => {
    component.markAllAsRead();
    expect(mockNotificationService.markAllAsRead).toHaveBeenCalled();
  });

  it('should handle notification click, mark as read, close dropdown and navigate to /my-property-inquiries for InquiryReceived', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.isDropdownOpen.set(true);

    const notification: Notification = {
      id: 'notif-1',
      title: 'استفسار جديد على عقارك',
      message: 'رسالة',
      type: 'InquiryReceived',
      isRead: false,
      createdAt: ''
    };

    component.onNotificationClick(notification);

    expect(mockNotificationService.markAsRead).toHaveBeenCalledWith('notif-1');
    expect(component.isDropdownOpen()).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/my-property-inquiries']);
  });

  it('should handle notification click, mark as read, close dropdown and navigate to /inquiries for InquiryStatusUpdated', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.isDropdownOpen.set(true);

    const notification: Notification = {
      id: 'notif-2',
      title: 'تحديث حالة الاستفسار',
      message: 'رسالة',
      type: 'InquiryStatusUpdated',
      isRead: false,
      createdAt: ''
    };

    component.onNotificationClick(notification);

    expect(mockNotificationService.markAsRead).toHaveBeenCalledWith('notif-2');
    expect(component.isDropdownOpen()).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/inquiries']);
  });

  it('should close dropdown on document click outside header component', () => {
    component.isDropdownOpen.set(true);

    const outsideClick = new MouseEvent('click', { bubbles: true });
    document.dispatchEvent(outsideClick);

    expect(component.isDropdownOpen()).toBe(false);
  });
});
