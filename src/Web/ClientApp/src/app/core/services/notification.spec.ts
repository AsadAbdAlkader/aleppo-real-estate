import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NotificationService } from './notification.service';
import { Notification, NotificationListResponse, UnreadCountResponse } from '../models/notification.model';

describe('NotificationService', () => {
  let service: NotificationService;
  let httpMock: HttpTestingController;

  const mockNotificationList: Notification[] = [
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
      isRead: true,
      createdAt: '2026-09-28T10:00:00Z'
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    });
    service = TestBed.inject(NotificationService);
    httpMock = TestBed.inject(HttpTestingController);

    // Clear initial unread count http request if present
    const initialReqs = httpMock.match('/api/notifications/unread-count');
    initialReqs.forEach(req => req.flush({ unreadCount: 1 }));
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch notifications via GET /api/notifications', () => {
    const mockResponse: NotificationListResponse = {
      items: mockNotificationList,
      totalCount: 2,
      pageNumber: 1,
      pageSize: 10,
      totalPages: 1
    };

    service.getNotifications(1, 10, false).subscribe((res) => {
      expect(res).toEqual(mockResponse);
      expect(service.notifications().length).toBe(2);
      expect(service.notifications()[0].id).toBe('notif-1');
    });

    const req = httpMock.expectOne('/api/notifications?pageNumber=1&pageSize=10&unreadOnly=false');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should fetch unread count via GET /api/notifications/unread-count', () => {
    const mockCountRes: UnreadCountResponse = { unreadCount: 3 };

    service.getUnreadCount().subscribe((res) => {
      expect(res.unreadCount).toBe(3);
      expect(service.unreadCount()).toBe(3);
    });

    const req = httpMock.expectOne('/api/notifications/unread-count');
    expect(req.request.method).toBe('GET');
    req.flush(mockCountRes);
  });

  it('should mark notification as read via PUT /api/notifications/{id}/read', () => {
    service.notifications.set([
      { id: 'notif-1', title: 'تست', message: 'تست', type: 'InquiryReceived', isRead: false, createdAt: '' }
    ]);
    service.unreadCount.set(1);

    service.markAsRead('notif-1').subscribe(() => {
      expect(service.notifications()[0].isRead).toBe(true);
      expect(service.unreadCount()).toBe(0);
    });

    const req = httpMock.expectOne('/api/notifications/notif-1/read');
    expect(req.request.method).toBe('PUT');
    req.flush(null);
  });

  it('should mark all notifications as read via PUT /api/notifications/read-all', () => {
    service.notifications.set([
      { id: 'notif-1', title: '1', message: '1', type: 'InquiryReceived', isRead: false, createdAt: '' },
      { id: 'notif-2', title: '2', message: '2', type: 'InquiryStatusUpdated', isRead: false, createdAt: '' }
    ]);
    service.unreadCount.set(2);

    service.markAllAsRead().subscribe(() => {
      expect(service.notifications().every(n => n.isRead)).toBe(true);
      expect(service.unreadCount()).toBe(0);
    });

    const req = httpMock.expectOne('/api/notifications/read-all');
    expect(req.request.method).toBe('PUT');
    req.flush(null);
  });

  it('should fallback to dev-mode mock data when GET /api/notifications fails', () => {
    service.getNotifications(1, 10, false).subscribe((res) => {
      expect(res).toBeDefined();
      expect(res.items.length).toBeGreaterThan(0);
    });

    const req = httpMock.expectOne('/api/notifications?pageNumber=1&pageSize=10&unreadOnly=false');
    req.error(new ProgressEvent('Network Error'));
  });
});
