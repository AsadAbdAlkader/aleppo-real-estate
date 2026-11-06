import { Injectable, inject, signal, isDevMode } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Notification, NotificationListResponse, UnreadCountResponse } from '../models/notification.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = '/api/notifications';

  private readonly STORAGE_KEY = 'dev_user_notifications';

  // Signals for application notification state
  readonly unreadCount = signal<number>(0);
  readonly notifications = signal<Notification[]>([]);
  readonly loading = signal<boolean>(false);

  constructor() {
    if (this.authService.isAuthenticated()) {
      this.getUnreadCount().subscribe({ error: () => {} });
    }
  }

  /**
   * Retrieves a paginated list of notifications for the current authenticated user.
   */
  getNotifications(pageNumber: number = 1, pageSize: number = 10, unreadOnly: boolean = false): Observable<NotificationListResponse> {
    this.loading.set(true);

    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString())
      .set('unreadOnly', unreadOnly.toString());

    return this.http.get<NotificationListResponse>(this.apiUrl, { params }).pipe(
      tap((response) => {
        this.loading.set(false);
        this.notifications.set(response.items || []);
      }),
      catchError((err) => {
        this.loading.set(false);
        if (isDevMode()) {
          console.warn('API getNotifications call failed. Triggering dev-mode fallback.', err);
          const allDevNotifs = this.getStoredDevNotifications();
          let filtered = allDevNotifs;
          if (unreadOnly) {
            filtered = allDevNotifs.filter(n => !n.isRead);
          }

          const totalCount = filtered.length;
          const totalPages = Math.ceil(totalCount / pageSize) || 1;
          const startIndex = (pageNumber - 1) * pageSize;
          const items = filtered.slice(startIndex, startIndex + pageSize);

          const mockResponse: NotificationListResponse = {
            items,
            totalCount,
            pageNumber,
            pageSize,
            totalPages
          };

          this.notifications.set(items);
          return of(mockResponse);
        }
        throw err;
      })
    );
  }

  /**
   * Retrieves total unread notifications count for the current authenticated user.
   */
  getUnreadCount(): Observable<UnreadCountResponse> {
    return this.http.get<UnreadCountResponse>(`${this.apiUrl}/unread-count`).pipe(
      tap((response) => {
        this.unreadCount.set(response.unreadCount ?? 0);
      }),
      catchError((err) => {
        if (isDevMode()) {
          console.warn('API getUnreadCount call failed. Triggering dev-mode fallback.', err);
          const allDevNotifs = this.getStoredDevNotifications();
          const count = allDevNotifs.filter(n => !n.isRead).length;
          this.unreadCount.set(count);
          return of({ unreadCount: count });
        }
        throw err;
      })
    );
  }

  /**
   * Marks a specific notification as read.
   */
  markAsRead(id: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/read`, {}).pipe(
      tap(() => {
        this.applyMarkAsRead(id);
      }),
      catchError((err) => {
        if (isDevMode()) {
          console.warn('API markAsRead call failed. Triggering dev-mode fallback.', err);
          this.applyMarkAsRead(id);
          return of(void 0);
        }
        throw err;
      })
    );
  }

  /**
   * Marks all notifications as read for the current user.
   */
  markAllAsRead(): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/read-all`, {}).pipe(
      tap(() => {
        this.applyMarkAllAsRead();
      }),
      catchError((err) => {
        if (isDevMode()) {
          console.warn('API markAllAsRead call failed. Triggering dev-mode fallback.', err);
          this.applyMarkAllAsRead();
          return of(void 0);
        }
        throw err;
      })
    );
  }

  private applyMarkAsRead(id: string): void {
    const currentList = this.notifications();
    const target = currentList.find(n => n.id === id);
    const wasUnread = target ? !target.isRead : false;

    const updatedList = currentList.map(n => n.id === id ? { ...n, isRead: true } : n);
    this.notifications.set(updatedList);

    if (wasUnread) {
      this.unreadCount.update(c => Math.max(0, c - 1));
    }

    if (isDevMode()) {
      const stored = this.getStoredDevNotifications();
      const updatedStored = stored.map(n => n.id === id ? { ...n, isRead: true } : n);
      this.saveStoredDevNotifications(updatedStored);
    }
  }

  private applyMarkAllAsRead(): void {
    const currentList = this.notifications();
    const updatedList = currentList.map(n => ({ ...n, isRead: true }));
    this.notifications.set(updatedList);
    this.unreadCount.set(0);

    if (isDevMode()) {
      const stored = this.getStoredDevNotifications();
      const updatedStored = stored.map(n => ({ ...n, isRead: true }));
      this.saveStoredDevNotifications(updatedStored);
    }
  }

  private saveStoredDevNotifications(items: Notification[]): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
      } catch (e) {
        console.error('Failed to save notifications to localStorage', e);
      }
    }
  }

  private getStoredDevNotifications(): Notification[] {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored) as Notification[];
        } catch {
          // fallback to default
        }
      }
    }
    const defaultData: Notification[] = [
      {
        id: 'notif-dev-1',
        title: 'استفسار جديد على عقارك',
        message: 'لديك استفسار جديد حول عقارك "شقة فاخرة للبيع في حي الشهباء" من المستخدم محمد أحمد.',
        type: 'InquiryReceived',
        referenceId: 'inq-dev-1',
        isRead: false,
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      },
      {
        id: 'notif-dev-2',
        title: 'تحديث حالة الاستفسار',
        message: 'تم تحديث حالة استفسارك للحصول على كشف مواصفات الشقة إلى "تم التواصل".',
        type: 'InquiryStatusUpdated',
        referenceId: 'inq-dev-2',
        isRead: false,
        createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
      },
      {
        id: 'notif-dev-3',
        title: 'استفسار جديد على عقارك',
        message: 'قام العميل سامر الحلبي بإرسال استفسار حول فيلا الفرقان.',
        type: 'InquiryReceived',
        referenceId: 'inq-dev-3',
        isRead: true,
        createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
      }
    ];
    this.saveStoredDevNotifications(defaultData);
    return defaultData;
  }
}
