import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { InquiryService } from '../../core/services/inquiry.service';
import { InquiryModalComponent } from './inquiry-modal.component';
import { MyInquiriesComponent } from './my-inquiries.component';
import { ReceivedInquiriesComponent } from './received-inquiries.component';
import { InquiryDto, CreateInquiryRequest, ReceivedInquiry, UpdateInquiryStatusDto } from '../../core/models/inquiry.model';
import { Property, PaginatedResult } from '../../core/models/property.model';

describe('InquiryService', () => {
  let service: InquiryService;
  let httpMock: HttpTestingController;

  const mockInquiry: InquiryDto = {
    id: 'inq-1',
    propertyId: 'prop-1',
    propertyTitle: 'شقة فاخرة بالشهباء',
    userId: 'user-1',
    userName: 'أحمد الحلبي',
    message: 'أرغب بزيارة هذا العقار ومعاينة الشقة في أقرب وقت ممكن.',
    phoneNumber: '+963912345678',
    status: 'New',
    createdAt: new Date().toISOString()
  };

  const mockReceivedInquiry: ReceivedInquiry = {
    id: 'rec-1',
    propertyId: 'prop-1',
    propertyTitle: 'شقة فاخرة بالشهباء',
    userId: 'buyer-1',
    buyerName: 'محمد العلي',
    phoneNumber: '+963944123456',
    message: 'أرغب بالمعاينة',
    status: 'New',
    createdAt: new Date().toISOString()
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        InquiryService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    });
    service = TestBed.inject(InquiryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should submit inquiry via POST /api/inquiries', () => {
    const request: CreateInquiryRequest = {
      propertyId: 'prop-1',
      message: 'أرغب بمعاينة العقار',
      phoneNumber: '+963912345678'
    };

    service.createInquiry(request, 'شقة فاخرة بالشهباء').subscribe((res) => {
      expect(res).toEqual(mockInquiry);
      expect(service.inquiries().length).toBeGreaterThan(0);
    });

    const req = httpMock.expectOne('/api/inquiries');
    expect(req.request.method).toBe('POST');
    req.flush(mockInquiry);
  });

  it('should fetch my inquiries via GET /api/inquiries/my', () => {
    service.getMyInquiries().subscribe((res) => {
      expect(res).toEqual([mockInquiry]);
      expect(service.inquiries()).toEqual([mockInquiry]);
    });

    const req = httpMock.expectOne('/api/inquiries/my');
    expect(req.request.method).toBe('GET');
    req.flush([mockInquiry]);
  });

  it('should fetch received inquiries via GET /api/inquiries/received', () => {
    const pagedResult: PaginatedResult<ReceivedInquiry> = {
      items: [mockReceivedInquiry],
      totalCount: 1,
      pageNumber: 1,
      pageSize: 10,
      totalPages: 1
    };

    service.getReceivedInquiries('New', 1, 10).subscribe((res) => {
      expect(res.items.length).toBe(1);
      expect(res.items[0].buyerName).toBe('محمد العلي');
    });

    const req = httpMock.expectOne((request) => request.url.endsWith('/api/inquiries/received'));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('status')).toBe('New');
    req.flush(pagedResult);
  });

  it('should update inquiry status via PUT /api/inquiries/{id}/status', () => {
    const dto: UpdateInquiryStatusDto = {
      status: 'Contacted',
      agentNotes: 'تم الاتصال بالعميل'
    };

    const updatedResponse: ReceivedInquiry = {
      ...mockReceivedInquiry,
      status: 'Contacted',
      agentNotes: 'تم الاتصال بالعميل'
    };

    service.updateInquiryStatus('rec-1', dto).subscribe((res) => {
      expect(res.status).toBe('Contacted');
      expect(res.agentNotes).toBe('تم الاتصال بالعميل');
    });

    const req = httpMock.expectOne('/api/inquiries/rec-1/status');
    expect(req.request.method).toBe('PUT');
    req.flush(updatedResponse);
  });

  it('should fallback to dev-mode stored inquiries on network failure', () => {
    const request: CreateInquiryRequest = {
      propertyId: 'prop-1',
      message: 'أرغب بمعاينة العقار',
      phoneNumber: '+963912345678'
    };

    service.createInquiry(request, 'شقة فاخرة بالشهباء').subscribe((res) => {
      expect(res).toBeTruthy();
      expect(res.propertyTitle).toBe('شقة فاخرة بالشهباء');
    });

    const req = httpMock.expectOne('/api/inquiries');
    req.error(new ProgressEvent('Network error'));
  });
});

describe('InquiryModalComponent', () => {
  const mockProperty: Property = {
    id: 'prop-1',
    title: 'شقة فاخرة بالشهباء',
    description: 'وصف',
    price: 250000,
    category: 'Apartment',
    cityArea: 'الشهباء',
    address: 'شارع النيل',
    bedrooms: 3,
    bathrooms: 2,
    areaSquareMeters: 180,
    imageUrls: ['image.jpg'],
    status: 'Available',
    isFeatured: true,
    createdAt: new Date().toISOString()
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InquiryModalComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    }).compileComponents();
  });

  it('should create inquiry modal component', () => {
    const fixture = TestBed.createComponent(InquiryModalComponent);
    fixture.componentRef.setInput('property', mockProperty);
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    const comp = fixture.componentInstance;
    expect(comp).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('إرسال استفسار عن العقار');
    expect(fixture.nativeElement.textContent).toContain('شقة فاخرة بالشهباء');
  });
});

describe('MyInquiriesComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyInquiriesComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    }).compileComponents();
  });

  it('should create my inquiries component', () => {
    const fixture = TestBed.createComponent(MyInquiriesComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('استفساراتي العقارية');
  });
});

describe('ReceivedInquiriesComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceivedInquiriesComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    }).compileComponents();
  });

  it('should create received inquiries component', () => {
    const fixture = TestBed.createComponent(ReceivedInquiriesComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('الاستفسارات الواردة');
  });
});
