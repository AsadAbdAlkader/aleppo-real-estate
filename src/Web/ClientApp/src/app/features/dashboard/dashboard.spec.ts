import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardComponent } from './dashboard.component';
import { DashboardData } from '../../core/models/dashboard.model';
import { AuthService } from '../../core/services/auth.service';
import { of } from 'rxjs';

describe('DashboardService', () => {
  let service: DashboardService;
  let httpMock: HttpTestingController;

  const mockDashboardData: DashboardData = {
    user: {
      id: 'usr-1',
      email: 'test@example.com',
      firstName: 'أحمد',
      lastName: 'الحلبي',
      role: 'Agent'
    },
    stats: {
      myPropertiesCount: 5,
      activePropertiesCount: 4,
      archivedPropertiesCount: 1,
      favoritesCount: 3,
      myInquiriesCount: 2
    },
    recentProperties: [
      {
        id: 'prop-1',
        title: 'شقة فاخرة في الشهباء',
        price: 250000,
        category: 'Apartment',
        cityArea: 'الشهباء',
        status: 'Available',
        createdAt: '2026-09-27T12:00:00Z'
      }
    ],
    recentFavorites: [
      {
        id: 'fav-1',
        title: 'فيلا مميزة في الفرقان',
        price: 500000,
        category: 'Villa',
        cityArea: 'الفرقان',
        status: 'Available'
      }
    ],
    recentInquiries: [
      {
        id: 'inq-1',
        propertyId: 'prop-1',
        propertyTitle: 'شقة فاخرة في الشهباء',
        message: 'أود حجز موعد للمعاينة',
        phoneNumber: '+963911111111',
        createdAt: '2026-09-27T14:00:00Z'
      }
    ]
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DashboardService,
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    });
    service = TestBed.inject(DashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch dashboard data via GET /api/dashboard', () => {
    service.loadDashboardData().subscribe((data) => {
      expect(data).toEqual(mockDashboardData);
      expect(service.dashboardData()).toEqual(mockDashboardData);
      expect(service.loading()).toBe(false);
      expect(service.error()).toBeNull();
    });

    const req = httpMock.expectOne('/api/dashboard');
    expect(req.request.method).toBe('GET');
    req.flush(mockDashboardData);
  });

  it('should fallback to dev-mode mock data when GET /api/dashboard fails', () => {
    service.loadDashboardData().subscribe((data) => {
      expect(data).toBeDefined();
      expect(data.stats).toBeDefined();
      expect(data.stats.myPropertiesCount).toBeGreaterThan(0);
      expect(service.dashboardData()).toBeDefined();
      expect(service.loading()).toBe(false);
    });

    const req = httpMock.expectOne('/api/dashboard');
    req.error(new ProgressEvent('Network error'));
  });
});

describe('DashboardComponent', () => {
  let mockDashboardService: Partial<DashboardService>;
  let mockAuthService: Partial<AuthService>;

  const mockData: DashboardData = {
    user: {
      id: 'usr-1',
      email: 'agent@example.com',
      firstName: 'سامر',
      lastName: 'العقاد',
      role: 'Agent'
    },
    stats: {
      myPropertiesCount: 10,
      activePropertiesCount: 8,
      archivedPropertiesCount: 2,
      favoritesCount: 5,
      myInquiriesCount: 3
    },
    recentProperties: [],
    recentFavorites: [],
    recentInquiries: []
  };

  beforeEach(async () => {
    mockDashboardService = {
      dashboardData: createSignal<DashboardData | null>(mockData),
      loading: createSignal<boolean>(false),
      error: createSignal<string | null>(null),
      loadDashboardData: () => of(mockData)
    } as any;

    mockAuthService = {
      currentUser: createSignal({ id: 'usr-1', email: 'agent@example.com', firstName: 'سامر', lastName: 'العقاد', role: 'Agent' }),
      isAuthenticated: createSignal(true),
      userRole: createSignal('Agent')
    } as any;

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: DashboardService, useValue: mockDashboardService },
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();
  });

  it('should create dashboard component', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const comp = fixture.componentInstance;
    fixture.detectChanges();
    expect(comp).toBeTruthy();
  });

  it('should format role badges accurately in Arabic', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const comp = fixture.componentInstance;
    
    expect(comp.getRoleBadge('Agent').label).toBe('وكيل عقاري');
    expect(comp.getRoleBadge('Admin').label).toBe('مدير النظام');
    expect(comp.getRoleBadge('Buyer').label).toBe('مشتري');
  });

  it('should translate property categories to Arabic', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const comp = fixture.componentInstance;

    expect(comp.getCategoryLabel('Apartment')).toBe('شقة سكنية');
    expect(comp.getCategoryLabel('Villa')).toBe('فيلا');
    expect(comp.getCategoryLabel('Commercial')).toBe('محل / مكتب تجاري');
    expect(comp.getCategoryLabel('Land')).toBe('أرض');
  });

  it('should translate property statuses to Arabic', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const comp = fixture.componentInstance;

    expect(comp.getStatusBadge('Available').label).toBe('متاح');
    expect(comp.getStatusBadge('Sold').label).toBe('مباع');
    expect(comp.getStatusBadge('Rented').label).toBe('مؤجر');
  });
});

function createSignal<T>(initialValue: T) {
  let val = initialValue;
  const sig = () => val;
  sig.set = (newVal: T) => { val = newVal; };
  return sig;
}
