import { Injectable, inject, signal, isDevMode } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { DashboardData } from '../models/dashboard.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = '/api/dashboard';

  readonly dashboardData = signal<DashboardData | null>(null);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  /**
   * Fetches aggregated dashboard data from backend API.
   * Uses dev-mode fallback when API is unavailable or returns an error.
   */
  loadDashboardData(): Observable<DashboardData> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.get<DashboardData>(this.apiUrl).pipe(
      tap((data) => {
        this.dashboardData.set(data);
        this.loading.set(false);
      }),
      catchError((err) => {
        this.loading.set(false);
        if (isDevMode()) {
          console.warn('API getDashboard call failed. Triggering dev-mode fallback data.', err);
          const mockData = this.getMockDashboardData();
          this.dashboardData.set(mockData);
          return of(mockData);
        }
        this.error.set('فشل في تحميل بيانات لوحة التحكم. يرجى المحاولة لاحقاً.');
        return of(this.getMockDashboardData());
      })
    );
  }

  /**
   * Generates realistic mock dashboard data for development mode and fallback testing.
   */
  private getMockDashboardData(): DashboardData {
    const currentUser = this.authService.currentUser();

    return {
      user: currentUser || {
        id: '3fa85f64-5717-4562-b3fc-2c963f66b111',
        email: 'user@example.com',
        firstName: 'أحمد',
        lastName: 'الحلبي',
        role: 'Agent'
      },
      stats: {
        myPropertiesCount: 4,
        activePropertiesCount: 3,
        archivedPropertiesCount: 1,
        favoritesCount: 2,
        myInquiriesCount: 1
      },
      recentProperties: [
        {
          id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
          ownerId: '3fa85f64-5717-4562-b3fc-2c963f66b111',
          title: 'شقة فاخرة للبيع في حي الشهباء',
          price: 250000.00,
          category: 'Apartment',
          cityArea: 'الشهباء',
          status: 'Available',
          createdAt: new Date().toISOString(),
          imageUrls: ['https://images.unsplash.com/photo-1560518883-ce09059eeffa']
        },
        {
          id: 'prop-102',
          ownerId: '3fa85f64-5717-4562-b3fc-2c963f66b111',
          title: 'مكتب تجاري مميز في العزيزية',
          price: 180000.00,
          category: 'Commercial',
          cityArea: 'العزيزية',
          status: 'Available',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          imageUrls: ['https://images.unsplash.com/photo-1497366216548-37526070297c']
        },
        {
          id: 'prop-103',
          ownerId: '3fa85f64-5717-4562-b3fc-2c963f66b111',
          title: 'فيلا حديثة مع حديقة في الفرقان',
          price: 650000.00,
          category: 'Villa',
          cityArea: 'الفرقان',
          status: 'Available',
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          imageUrls: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9']
        },
        {
          id: 'prop-104',
          ownerId: '3fa85f64-5717-4562-b3fc-2c963f66b111',
          title: 'أرض معدة للبناء في الموكامبو',
          price: 420000.00,
          category: 'Land',
          cityArea: 'الموكامبو',
          status: 'Sold',
          createdAt: new Date(Date.now() - 259200000).toISOString(),
          imageUrls: ['https://images.unsplash.com/photo-1500382017468-9049fed747ef']
        }
      ],
      recentFavorites: [
        {
          id: 'fav-201',
          title: 'فيلا مستقلة مع حديقة في الفرقان',
          price: 680000.00,
          category: 'Villa',
          cityArea: 'الفرقان',
          status: 'Available',
          imageUrls: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c']
        },
        {
          id: 'fav-202',
          title: 'شقة سكنية ديلوكس في المحافظة',
          price: 310000.00,
          category: 'Apartment',
          cityArea: 'المحافظة',
          status: 'Available',
          imageUrls: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750']
        }
      ],
      recentInquiries: [
        {
          id: 'inq-301',
          propertyId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
          propertyTitle: 'شقة فاخرة للبيع في حي الشهباء',
          message: 'أرغب بزيارة هذا العقار ومعاينة الشقة في أقرب وقت ممكن.',
          phoneNumber: '+963912345678',
          createdAt: new Date(Date.now() - 3600000).toISOString()
        }
      ]
    };
  }
}
