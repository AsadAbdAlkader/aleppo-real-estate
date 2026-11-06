import { Injectable, inject, signal, isDevMode } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { 
  CreateInquiryRequest, 
  Inquiry, 
  ReceivedInquiry, 
  UpdateInquiryStatusDto 
} from '../models/inquiry.model';
import { PaginatedResult } from '../models/property.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class InquiryService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = '/api/inquiries';

  private readonly STORAGE_KEY = 'dev_user_inquiries';
  private readonly RECEIVED_STORAGE_KEY = 'dev_received_inquiries';

  // Signals for state management
  readonly inquiries = signal<Inquiry[]>(this.getInitialStoredInquiries());
  readonly loading = signal<boolean>(false);

  constructor() {
    if (this.authService.isAuthenticated()) {
      this.getMyInquiries().subscribe();
    }
  }

  /**
   * Submits a user inquiry for a property.
   */
  createInquiry(request: CreateInquiryRequest, propertyTitle?: string): Observable<Inquiry> {
    return this.http.post<Inquiry>(this.apiUrl, request).pipe(
      tap((newInquiry) => {
        const current = this.inquiries();
        const updated = [newInquiry, ...current];
        this.inquiries.set(updated);
        this.saveToStorage(updated);
      }),
      catchError((err) => {
        if (isDevMode()) {
          console.warn('API createInquiry call failed. Triggering dev-mode fallback.', err);
          const currentUser = this.authService.currentUser();
          const mockInquiry: Inquiry = {
            id: 'inq-dev-' + Date.now(),
            propertyId: request.propertyId,
            propertyTitle: propertyTitle || 'عقار رقم ' + request.propertyId,
            userId: currentUser?.id || 'user-dev-1',
            userName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'مستخدم تجريبي',
            message: request.message,
            phoneNumber: request.phoneNumber,
            status: 'New',
            createdAt: new Date().toISOString()
          };
          const current = this.inquiries();
          const updated = [mockInquiry, ...current];
          this.inquiries.set(updated);
          this.saveToStorage(updated);
          return of(mockInquiry);
        }
        throw err;
      })
    );
  }

  /**
   * Fetches all inquiries submitted by the current user.
   */
  getMyInquiries(): Observable<Inquiry[]> {
    this.loading.set(true);
    return this.http.get<Inquiry[]>(`${this.apiUrl}/my`).pipe(
      tap((data) => {
        const normalized = (data || []).map(item => ({
          ...item,
          status: item.status || 'New'
        }));
        this.inquiries.set(normalized);
        this.loading.set(false);
        this.saveToStorage(normalized);
      }),
      catchError((err) => {
        this.loading.set(false);
        if (isDevMode()) {
          console.warn('API getMyInquiries call failed. Loading dev-mode stored inquiries.', err);
          const stored = this.getInitialStoredInquiries();
          this.inquiries.set(stored);
          return of(stored);
        }
        return of([]);
      })
    );
  }

  /**
   * Fetches inquiries received for properties owned by current user.
   */
  getReceivedInquiries(status?: string, pageNumber: number = 1, pageSize: number = 10): Observable<PaginatedResult<ReceivedInquiry>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    if (status && status !== 'All' && status !== 'الكل') {
      params = params.set('status', status);
    }

    return this.http.get<PaginatedResult<ReceivedInquiry>>(`${this.apiUrl}/received`, { params }).pipe(
      catchError((err) => {
        if (isDevMode()) {
          console.warn('API getReceivedInquiries call failed. Triggering dev-mode fallback.', err);
          const allReceived = this.getInitialStoredReceivedInquiries();
          
          let filtered = allReceived;
          if (status && status !== 'All' && status !== 'الكل') {
            filtered = allReceived.filter(x => x.status === status);
          }

          const totalCount = filtered.length;
          const totalPages = Math.ceil(totalCount / pageSize) || 1;
          const startIndex = (pageNumber - 1) * pageSize;
          const items = filtered.slice(startIndex, startIndex + pageSize);

          const result: PaginatedResult<ReceivedInquiry> = {
            items,
            totalCount,
            pageNumber,
            pageSize,
            totalPages
          };
          return of(result);
        }
        throw err;
      })
    );
  }

  /**
   * Updates status and agent notes of a received inquiry.
   */
  updateInquiryStatus(inquiryId: string, dto: UpdateInquiryStatusDto): Observable<ReceivedInquiry> {
    return this.http.put<ReceivedInquiry>(`${this.apiUrl}/${inquiryId}/status`, dto).pipe(
      tap((updated) => {
        this.updateDevReceivedStorage(updated);
      }),
      catchError((err) => {
        if (isDevMode()) {
          console.warn('API updateInquiryStatus call failed. Triggering dev-mode fallback.', err);
          const allReceived = this.getInitialStoredReceivedInquiries();
          const index = allReceived.findIndex(x => x.id === inquiryId);
          
          if (index !== -1) {
            allReceived[index] = {
              ...allReceived[index],
              status: dto.status,
              agentNotes: dto.agentNotes,
              updatedAt: new Date().toISOString()
            };
            this.saveReceivedToStorage(allReceived);
            return of(allReceived[index]);
          } else {
            const fallback: ReceivedInquiry = {
              id: inquiryId,
              propertyId: 'prop-dev',
              propertyTitle: 'عقار تجريبي',
              userId: 'user-dev',
              buyerName: 'مشتري تجريبي',
              phoneNumber: '+963911111111',
              message: 'رسالة تجريبية',
              status: dto.status,
              agentNotes: dto.agentNotes,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            allReceived.unshift(fallback);
            this.saveReceivedToStorage(allReceived);
            return of(fallback);
          }
        }
        throw err;
      })
    );
  }

  private saveToStorage(items: Inquiry[]): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
      } catch (e) {
        console.error('Failed to save inquiries to localStorage', e);
      }
    }
  }

  private getInitialStoredInquiries(): Inquiry[] {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as Inquiry[];
          return parsed.map(item => ({ ...item, status: item.status || 'New' }));
        } catch {
          return [];
        }
      }
    }
    return [];
  }

  private saveReceivedToStorage(items: ReceivedInquiry[]): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(this.RECEIVED_STORAGE_KEY, JSON.stringify(items));
      } catch (e) {
        console.error('Failed to save received inquiries to localStorage', e);
      }
    }
  }

  private updateDevReceivedStorage(updated: ReceivedInquiry): void {
    const list = this.getInitialStoredReceivedInquiries();
    const idx = list.findIndex(x => x.id === updated.id);
    if (idx !== -1) {
      list[idx] = updated;
    } else {
      list.unshift(updated);
    }
    this.saveReceivedToStorage(list);
  }

  private getInitialStoredReceivedInquiries(): ReceivedInquiry[] {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(this.RECEIVED_STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored) as ReceivedInquiry[];
        } catch {
          // fallback to default
        }
      }
    }
    const defaultData: ReceivedInquiry[] = [
      {
        id: 'rec-inq-1',
        propertyId: 'prop-1',
        propertyTitle: 'شقة فاخرة للبيع في حي الشهباء',
        userId: 'buyer-1',
        buyerName: 'محمد أحمد العلي',
        phoneNumber: '+963944123456',
        message: 'أرغب بمعاينة الشقة يوم السبت القادم بين الساعة 10 صباحاً و 12 ظهراً، هل الوقت مناسب؟',
        status: 'New',
        createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
      },
      {
        id: 'rec-inq-2',
        propertyId: 'prop-2',
        propertyTitle: 'فيلا حديثة مع مسبح في العزيزية',
        userId: 'buyer-2',
        buyerName: 'سارة حموي',
        phoneNumber: '+963955987654',
        message: 'هل السعر المطلوب شامل أثاث المطبخ؟ وما هي خيارات الدفع والتقسيط المتاحة؟',
        status: 'Contacted',
        agentNotes: 'تم الاتصال بالعميلة هاتفياً وإرسال كشف المواصفات. في انتظار رد العائلة لحجز موعد.',
        createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
      },
      {
        id: 'rec-inq-3',
        propertyId: 'prop-1',
        propertyTitle: 'شقة فاخرة للبيع في حي الشهباء',
        userId: 'buyer-3',
        buyerName: 'خالد الحلبي',
        phoneNumber: '+963933112233',
        message: 'أود الاستفسار عن وضع سند الملكية (الطابو) وهل يوجد أي رهن على العقار؟',
        status: 'Closed',
        agentNotes: 'تم تأكيد أن الطابو أخضر 2400 سهم ونظيف تماماً. تم إغلاق الطلب بعد الشراء.',
        createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString()
      },
      {
        id: 'rec-inq-4',
        propertyId: 'prop-3',
        propertyTitle: 'محل تجاري للاستثمار في السليمانية',
        userId: 'buyer-4',
        buyerName: 'عمر درويش',
        phoneNumber: '+963966445566',
        message: 'هل المحل التجاري مناسب لنشاط صيدلية؟ وهل تتوفر رخصة تجارية جاهزة؟',
        status: 'New',
        createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString()
      }
    ];
    this.saveReceivedToStorage(defaultData);
    return defaultData;
  }
}
