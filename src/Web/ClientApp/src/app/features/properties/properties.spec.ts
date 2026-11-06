import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { PropertyService } from '../../core/services/property.service';
import { AuthService } from '../../core/services/auth.service';
import { PropertyListComponent } from './property-list/property-list.component';
import { PropertyCardComponent } from './property-card/property-card.component';
import { SearchFilterPanelComponent } from './search-filter-panel/search-filter-panel.component';
import { MyPropertiesComponent } from './my-properties.component';
import { PropertyFormModalComponent } from './property-form-modal.component';
import { DeleteConfirmModalComponent } from './delete-confirm-modal.component';
import { ImageManagerComponent } from './image-manager/image-manager.component';
import { PropertyDetailComponent } from './property-detail.component';
import { Property, PaginatedResult } from '../../core/models/property.model';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('PropertyService', () => {
  let service: PropertyService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PropertyService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(PropertyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call GET /api/properties with query params', () => {
    const mockResult: PaginatedResult<Property> = {
      items: [
        {
          id: '1',
          title: 'شقة في الشهباء',
          description: 'شقة ممتازة',
          price: 250000,
          category: 'Apartment',
          purpose: 'Sale',
          city: 'حلب',
          cityArea: 'الشهباء',
          address: 'شارع النيل',
          bedrooms: 3,
          bathrooms: 2,
          areaSquareMeters: 180,
          imageUrls: ['img1.jpg'],
          status: 'Available',
          isFeatured: true,
          createdAt: new Date().toISOString()
        }
      ],
      totalCount: 1,
      pageNumber: 1,
      pageSize: 10,
      totalPages: 1
    };

    service.getProperties({ searchTerm: 'الشهباء', category: 'Apartment', purpose: 'Sale', minArea: 100, sortBy: 'price_asc' }).subscribe(result => {
      expect(result).toEqual(mockResult);
    });

    const req = httpMock.expectOne(request => request.url === '/api/properties');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('searchTerm')).toBe('الشهباء');
    expect(req.request.params.get('category')).toBe('Apartment');
    expect(req.request.params.get('purpose')).toBe('Sale');
    expect(req.request.params.get('minArea')).toBe('100');
    expect(req.request.params.get('sortBy')).toBe('price_asc');
    req.flush(mockResult);
  });

  it('should fallback to mock properties when network error occurs', () => {
    service.getProperties({ searchTerm: 'الشهباء' }).subscribe(result => {
      expect(result).toBeTruthy();
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.items.some(p => p.cityArea.includes('الشهباء'))).toBe(true);
    });

    const req = httpMock.expectOne(request => request.url === '/api/properties');
    req.error(new ProgressEvent('Network error'));
  });

  it('should filter mock properties by category, purpose, and sort on fallback', () => {
    service.getProperties({ category: 'Apartment', purpose: 'Sale', sortBy: 'price_asc' }).subscribe(result => {
      expect(result.items.every(p => p.category.toLowerCase() === 'apartment')).toBe(true);
      expect(result.items.every(p => p.purpose?.toLowerCase() === 'sale')).toBe(true);
      for (let i = 0; i < result.items.length - 1; i++) {
        expect(result.items[i].price).toBeLessThanOrEqual(result.items[i + 1].price);
      }
    });

    const req = httpMock.expectOne(request => request.url === '/api/properties');
    req.error(new ProgressEvent('Network error'));
  });

  it('should fallback to mock property by ID when network error occurs', () => {
    service.getPropertyById('3fa85f64-5717-4562-b3fc-2c963f66afa6').subscribe(result => {
      expect(result).toBeTruthy();
      expect(result.id).toBe('3fa85f64-5717-4562-b3fc-2c963f66afa6');
    });

    const req = httpMock.expectOne('/api/properties/3fa85f64-5717-4562-b3fc-2c963f66afa6');
    req.error(new ProgressEvent('Network error'));
  });

  it('should fallback to creating mock property when network error occurs', () => {
    const newDto = {
      title: 'جديد',
      description: 'وصف',
      price: 100000,
      category: 'Apartment',
      cityArea: 'الشهباء',
      address: 'شارع',
      bedrooms: 2,
      bathrooms: 1,
      areaSquareMeters: 100,
      imageUrls: []
    };

    service.createProperty(newDto).subscribe(result => {
      expect(result).toBeTruthy();
      expect(result.title).toBe('جديد');
      expect(result.id).toContain('mock-');
    });

    const req = httpMock.expectOne('/api/properties');
    expect(req.request.method).toBe('POST');
    req.error(new ProgressEvent('Network error'));
  });

  it('should call GET /api/properties/my and fallback on network error', () => {
    service.getMyProperties().subscribe(result => {
      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(0);
    });

    const req = httpMock.expectOne('/api/properties/my');
    expect(req.request.method).toBe('GET');
    req.error(new ProgressEvent('Network error'));
  });

  it('should call PUT /api/properties/{id} and fallback on network error', () => {
    const updateDto = {
      title: 'عنوان معدل',
      description: 'وصف معدل ممتاز',
      price: 300000,
      category: 'Apartment',
      cityArea: 'الشهباء',
      address: 'شارع النيل',
      bedrooms: 4,
      bathrooms: 3,
      areaSquareMeters: 200,
      imageUrls: ['img.jpg'],
      status: 'Available'
    };

    service.updateProperty('3fa85f64-5717-4562-b3fc-2c963f66afa6', updateDto).subscribe(result => {
      expect(result).toBeTruthy();
      expect(result.title).toBe('عنوان معدل');
    });

    const req = httpMock.expectOne('/api/properties/3fa85f64-5717-4562-b3fc-2c963f66afa6');
    expect(req.request.method).toBe('PUT');
    req.error(new ProgressEvent('Network error'));
  });

  it('should call DELETE /api/properties/{id} and fallback on network error', () => {
    service.deleteProperty('3fa85f64-5717-4562-b3fc-2c963f66afa6').subscribe(result => {
      expect(result).toBeTruthy();
    });

    const req = httpMock.expectOne('/api/properties/3fa85f64-5717-4562-b3fc-2c963f66afa6');
    expect(req.request.method).toBe('DELETE');
    req.error(new ProgressEvent('Network error'));
  });

  it('should call POST /api/properties/{id}/images and fallback on network error', () => {
    const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
    service.uploadImages('3fa85f64-5717-4562-b3fc-2c963f66afa6', [file]).subscribe(result => {
      expect(result).toBeTruthy();
      expect(result.propertyId).toBe('3fa85f64-5717-4562-b3fc-2c963f66afa6');
      expect(result.imageUrls.length).toBeGreaterThan(0);
    });

    const req = httpMock.expectOne('/api/properties/3fa85f64-5717-4562-b3fc-2c963f66afa6/images');
    expect(req.request.method).toBe('POST');
    req.error(new ProgressEvent('Network error'));
  });

  it('should call DELETE /api/properties/{id}/images and fallback on network error', () => {
    const imageUrl = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&auto=format&fit=crop';
    service.deleteImage('3fa85f64-5717-4562-b3fc-2c963f66afa6', imageUrl).subscribe(result => {
      expect(result).toBeTruthy();
      expect(result.propertyId).toBe('3fa85f64-5717-4562-b3fc-2c963f66afa6');
    });

    const req = httpMock.expectOne('/api/properties/3fa85f64-5717-4562-b3fc-2c963f66afa6/images');
    expect(req.request.method).toBe('DELETE');
    req.error(new ProgressEvent('Network error'));
  });

  it('should call PUT /api/properties/{id}/images/primary and fallback on network error', () => {
    const imageUrl = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&auto=format&fit=crop';
    service.setPrimaryImage('3fa85f64-5717-4562-b3fc-2c963f66afa6', imageUrl).subscribe(result => {
      expect(result).toBeTruthy();
      expect(result.primaryImageUrl).toBe(imageUrl);
    });

    const req = httpMock.expectOne('/api/properties/3fa85f64-5717-4562-b3fc-2c963f66afa6/images/primary');
    expect(req.request.method).toBe('PUT');
    req.error(new ProgressEvent('Network error'));
  });
});

describe('PropertyCardComponent', () => {
  let mockProperty: Property;

  beforeEach(async () => {
    mockProperty = {
      id: 'test-1',
      title: 'شقة تجريبية في الشهباء',
      description: 'وصف تجريبي',
      price: 200000,
      category: 'Apartment',
      purpose: 'Sale',
      city: 'حلب',
      cityArea: 'الشهباء',
      address: 'شارع النيل',
      bedrooms: 3,
      bathrooms: 2,
      areaSquareMeters: 150,
      imageUrls: ['https://example.com/image.jpg'],
      status: 'Available',
      isFeatured: true,
      createdAt: new Date().toISOString()
    };

    await TestBed.configureTestingModule({
      imports: [PropertyCardComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'properties', component: PropertyListComponent }])
      ]
    }).compileComponents();
  });

  it('should create property card component', () => {
    const fixture = TestBed.createComponent(PropertyCardComponent);
    fixture.componentRef.setInput('property', mockProperty);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('شقة تجريبية في الشهباء');
    expect(fixture.nativeElement.textContent).toContain('الشهباء');
  });
});

describe('SearchFilterPanelComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchFilterPanelComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'properties', component: PropertyListComponent }])
      ]
    }).compileComponents();
  });

  it('should create search filter panel component', () => {
    const fixture = TestBed.createComponent(SearchFilterPanelComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(component.searchTerm()).toBe('');
    expect(component.purpose()).toBe('all');
    expect(component.cityArea()).toBe('all');
  });

  it('should update signals on setPurpose and clearFilters', () => {
    const fixture = TestBed.createComponent(SearchFilterPanelComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.setPurpose('Sale');
    expect(component.purpose()).toBe('Sale');

    component.onSearchTermChange('فيلا');
    expect(component.searchTerm()).toBe('فيلا');

    component.clearFilters();
    expect(component.purpose()).toBe('all');
    expect(component.searchTerm()).toBe('');
  });

  it('should toggle advanced filters display', () => {
    const fixture = TestBed.createComponent(SearchFilterPanelComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.showAdvanced()).toBe(false);
    component.toggleAdvanced();
    expect(component.showAdvanced()).toBe(true);
  });
});

describe('PropertyListComponent', () => {
  let mockPropertyService: Partial<PropertyService>;
  const dummyProperties: Property[] = [
    {
      id: '1',
      title: 'شقة في الشهباء',
      description: 'وصف',
      price: 250000,
      category: 'Apartment',
      purpose: 'Sale',
      city: 'حلب',
      cityArea: 'الشهباء',
      address: 'شارع النيل',
      bedrooms: 3,
      bathrooms: 2,
      areaSquareMeters: 180,
      imageUrls: ['img1.jpg'],
      status: 'Available',
      isFeatured: true,
      createdAt: new Date().toISOString()
    }
  ];

  beforeEach(async () => {
    mockPropertyService = {
      getProperties: (params) => {
        let filtered = dummyProperties;
        if (params?.searchTerm) {
          filtered = filtered.filter(p => p.title.includes(params.searchTerm!) || p.cityArea.includes(params.searchTerm!));
        }
        return of({
          items: filtered,
          totalCount: filtered.length,
          pageNumber: params?.pageNumber || 1,
          pageSize: params?.pageSize || 6,
          totalPages: 1
        });
      }
    };

    await TestBed.configureTestingModule({
      imports: [PropertyListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'properties', component: PropertyListComponent }]),
        { provide: PropertyService, useValue: mockPropertyService }
      ]
    }).compileComponents();
  });

  it('should create property list component and load properties', () => {
    const fixture = TestBed.createComponent(PropertyListComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(component.properties().length).toBe(1);
    expect(component.properties()[0].title).toBe('شقة في الشهباء');
  });

  it('should navigate on goToPage call', () => {
    const fixture = TestBed.createComponent(PropertyListComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.totalPages.set(3);
    component.goToPage(2);
    expect(component).toBeTruthy();
  });
});

describe('MyPropertiesComponent & Modals', () => {
  let mockPropertyService: Partial<PropertyService>;
  const mockUserProperties: Property[] = [
    {
      id: 'my-1',
      title: 'عقاري الخاص 1',
      description: 'وصف عقاري الخاص الأول',
      price: 150000,
      category: 'Apartment',
      purpose: 'Sale',
      city: 'حلب',
      cityArea: 'الشهباء',
      address: 'شارع النيل',
      bedrooms: 2,
      bathrooms: 1,
      areaSquareMeters: 120,
      imageUrls: ['img1.jpg'],
      status: 'Available',
      isFeatured: false,
      createdAt: new Date().toISOString()
    }
  ];

  beforeEach(async () => {
    mockPropertyService = {
      getMyProperties: () => of([...mockUserProperties]),
      createProperty: (dto) => of({
        id: 'new-1',
        ...dto,
        status: 'Available',
        isFeatured: false,
        createdAt: new Date().toISOString()
      }),
      updateProperty: (id, dto) => of({
        id,
        ...dto,
        status: dto.status || 'Available',
        isFeatured: false,
        createdAt: new Date().toISOString()
      }),
      deleteProperty: (id) => of({ message: 'Deleted' })
    };

    await TestBed.configureTestingModule({
      imports: [
        MyPropertiesComponent,
        PropertyFormModalComponent,
        DeleteConfirmModalComponent
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'properties', component: PropertyListComponent }]),
        { provide: PropertyService, useValue: mockPropertyService }
      ]
    }).compileComponents();
  });

  it('should create MyPropertiesComponent and load user properties', () => {
    const fixture = TestBed.createComponent(MyPropertiesComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(component.properties().length).toBe(1);
    expect(component.properties()[0].title).toBe('عقاري الخاص 1');
  });

  it('should handle open and close create/edit modals', () => {
    const fixture = TestBed.createComponent(MyPropertiesComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.openCreateModal();
    expect(component.isFormModalOpen()).toBe(true);
    expect(component.selectedPropertyForEdit()).toBeNull();

    component.closeFormModal();
    expect(component.isFormModalOpen()).toBe(false);

    component.openEditModal(mockUserProperties[0]);
    expect(component.isFormModalOpen()).toBe(true);
    expect(component.selectedPropertyForEdit()?.id).toBe('my-1');
  });

  it('should handle property deletion trigger and update signal list', () => {
    const fixture = TestBed.createComponent(MyPropertiesComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.openDeleteModal(mockUserProperties[0]);
    expect(component.isDeleteModalOpen()).toBe(true);
    expect(component.selectedPropertyForDelete()?.id).toBe('my-1');

    component.onDeleteConfirmed('my-1');
    expect(component.properties().length).toBe(0);
    expect(component.isDeleteModalOpen()).toBe(false);
  });

  it('should validate and submit PropertyFormModalComponent in Create mode', () => {
    const fixture = TestBed.createComponent(PropertyFormModalComponent);
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('property', null);
    fixture.detectChanges();

    expect(component.propertyForm.valid).toBe(false);

    component.propertyForm.patchValue({
      title: 'شقة جديدة ممتازة',
      description: 'وصف تفصيلي كامل للشقة الحديثة',
      price: 200000,
      category: 'Apartment',
      cityArea: 'الشهباء',
      address: 'شارع الحديقة',
      bedrooms: 3,
      bathrooms: 2,
      areaSquareMeters: 140
    });

    expect(component.propertyForm.valid).toBe(true);

    let emittedProp: Property | null = null;
    component.saved.subscribe((p: Property) => emittedProp = p);

    component.onSubmit();
    expect(emittedProp).toBeTruthy();
    expect((emittedProp as any).title).toBe('شقة جديدة ممتازة');
  });

  it('should populate and submit PropertyFormModalComponent in Update mode', () => {
    const fixture = TestBed.createComponent(PropertyFormModalComponent);
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('property', mockUserProperties[0]);
    fixture.detectChanges();

    component.ngOnChanges({
      property: {
        currentValue: mockUserProperties[0],
        previousValue: null,
        firstChange: true,
        isFirstChange: () => true
      },
      isOpen: {
        currentValue: true,
        previousValue: false,
        firstChange: true,
        isFirstChange: () => true
      }
    });
    fixture.detectChanges();

    expect(component.propertyForm.value.title).toBe('عقاري الخاص 1');

    component.propertyForm.patchValue({ title: 'عقاري الخاص المحدث' });

    let emittedProp: Property | null = null;
    component.saved.subscribe((p: Property) => emittedProp = p);

    component.onSubmit();
    expect(emittedProp).toBeTruthy();
    expect((emittedProp as any).title).toBe('عقاري الخاص المحدث');
  });

  it('should render DeleteConfirmModalComponent and emit confirmed event', () => {
    const fixture = TestBed.createComponent(DeleteConfirmModalComponent);
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('property', mockUserProperties[0]);
    fixture.detectChanges();

    let deletedId: string | null = null;
    component.confirmed.subscribe((id: string) => deletedId = id);

    component.onConfirm();
    expect(deletedId).toBe('my-1');
    expect(component.deleting()).toBe(true);
  });
});

describe('ImageManagerComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageManagerComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();
  });

  it('should create ImageManagerComponent and display initial images', () => {
    const fixture = TestBed.createComponent(ImageManagerComponent);
    fixture.componentRef.setInput('images', ['https://example.com/img1.jpg', 'https://example.com/img2.jpg']);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
    expect(component.imageUrls().length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('معرض صور العقار (2)');
    expect(fixture.nativeElement.textContent).toContain('الرئيسية');
  });

  it('should validate file size and format on file selection', () => {
    const fixture = TestBed.createComponent(ImageManagerComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    const invalidFile = new File(['fake content'], 'document.pdf', { type: 'application/pdf' });
    const eventInvalid = { target: { files: [invalidFile], value: '' } } as any;
    component.onFileSelected(eventInvalid);

    expect(component.validationError()).toContain('نوع الملف غير مدعوم');

    const largeContent = new ArrayBuffer(6 * 1024 * 1024);
    const largeFile = new File([largeContent], 'big.jpg', { type: 'image/jpeg' });
    const eventLarge = { target: { files: [largeFile], value: '' } } as any;
    component.onFileSelected(eventLarge);

    expect(component.validationError()).toContain('تتجاوز الحد المسموح 5 ميجابايت');
  });

  it('should set an image as primary image', () => {
    const fixture = TestBed.createComponent(ImageManagerComponent);
    const initialImages = ['https://example.com/img1.jpg', 'https://example.com/img2.jpg', 'https://example.com/img3.jpg'];
    fixture.componentRef.setInput('images', initialImages);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    let updatedUrls: string[] = [];
    component.imagesChange.subscribe(urls => updatedUrls = urls);

    component.setPrimary('https://example.com/img3.jpg');

    expect(component.imageUrls()[0]).toBe('https://example.com/img3.jpg');
    expect(updatedUrls[0]).toBe('https://example.com/img3.jpg');
  });

  it('should delete an image from gallery', () => {
    const fixture = TestBed.createComponent(ImageManagerComponent);
    const initialImages = ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'];
    fixture.componentRef.setInput('images', initialImages);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    let updatedUrls: string[] = [];
    component.imagesChange.subscribe(urls => updatedUrls = urls);

    component.deleteImage('https://example.com/img1.jpg');

    expect(component.imageUrls().length).toBe(1);
    expect(component.imageUrls()[0]).toBe('https://example.com/img2.jpg');
    expect(updatedUrls.length).toBe(1);
  });

  it('should add image via direct URL input', () => {
    const fixture = TestBed.createComponent(ImageManagerComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    let updatedUrls: string[] = [];
    component.imagesChange.subscribe(urls => updatedUrls = urls);

    component.urlInput.set('https://example.com/new-image.jpg');
    component.addUrlImage();

    expect(component.imageUrls()).toContain('https://example.com/new-image.jpg');
    expect(updatedUrls).toContain('https://example.com/new-image.jpg');
    expect(component.urlInput()).toBe('');
  });
});

describe('PropertyDetailComponent', () => {
  let mockPropertyService: Partial<PropertyService>;
  let mockAuthService: Partial<AuthService>;
  let router: Router;
  const isAuthenticatedSignal = signal<boolean>(false);

  const mockDetailProperty: Property = {
    id: 'detail-123',
    ownerId: 'owner-456',
    ownerName: 'وكيل حلب المعتمد',
    title: 'شقة فاخرة للتفاصيل',
    description: 'شقة سكنية بتشطيبات رائعة وموقع ممتاز جداً في حي الشهباء',
    price: 350000,
    category: 'Apartment',
    purpose: 'Sale',
    city: 'حلب',
    cityArea: 'الشهباء',
    address: 'شارع النيل',
    bedrooms: 4,
    bathrooms: 3,
    areaSquareMeters: 220,
    imageUrls: ['https://example.com/cover.jpg', 'https://example.com/sub1.jpg'],
    status: 'Available',
    isFeatured: true,
    createdAt: new Date().toISOString()
  };

  beforeEach(async () => {
    isAuthenticatedSignal.set(false);

    mockPropertyService = {
      getPropertyById: (id: string) => {
        if (id === 'detail-123') {
          return of(mockDetailProperty);
        }
        if (id === 'no-images') {
          return of({
            ...mockDetailProperty,
            id: 'no-images',
            imageUrls: []
          });
        }
        return throwError(() => ({ status: 404, message: 'Not found' }));
      }
    };

    mockAuthService = {
      isAuthenticated: isAuthenticatedSignal,
      currentUser: signal(null),
      userRole: signal(null)
    };

    await TestBed.configureTestingModule({
      imports: [PropertyDetailComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ id: 'detail-123' }))
          }
        },
        { provide: PropertyService, useValue: mockPropertyService },
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  it('should create PropertyDetailComponent and render loaded property details without ownerEmail', () => {
    const fixture = TestBed.createComponent(PropertyDetailComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(component.loading()).toBe(false);
    expect(component.notFound()).toBe(false);
    expect(component.property()?.id).toBe('detail-123');
    expect(component.ownerName()).toBe('وكيل حلب المعتمد');
    expect((component as any).ownerEmail).toBeUndefined();
    expect(fixture.nativeElement.textContent).toContain('شقة فاخرة للتفاصيل');
    expect(fixture.nativeElement.textContent).toContain('وكيل حلب المعتمد');
    expect(fixture.nativeElement.textContent).not.toContain('agent-detail@aleppo.com');
  });

  it('should redirect unauthenticated user to login with returnUrl when toggling favorite', () => {
    const fixture = TestBed.createComponent(PropertyDetailComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const navigateSpy = vi.spyOn(router, 'navigate');
    component.onToggleFavorite();

    expect(navigateSpy).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: router.url } });
  });

  it('should redirect unauthenticated user to login with returnUrl when opening inquiry modal or direct contact', () => {
    const fixture = TestBed.createComponent(PropertyDetailComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const navigateSpy = vi.spyOn(router, 'navigate');

    component.onOpenInquiryModal();
    expect(navigateSpy).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: router.url } });

    component.onDirectContact();
    expect(navigateSpy).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: router.url } });
  });

  it('should open inquiry modal for authenticated user', () => {
    isAuthenticatedSignal.set(true);
    const fixture = TestBed.createComponent(PropertyDetailComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.onOpenInquiryModal();
    expect(component.isInquiryModalOpen()).toBe(true);

    component.onCloseInquiryModal();
    expect(component.isInquiryModalOpen()).toBe(false);
  });

  it('should display fallback cover image when imageUrls is empty', () => {
    const fixture = TestBed.createComponent(PropertyDetailComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.property.set({
      ...mockDetailProperty,
      id: 'no-images',
      imageUrls: []
    });
    fixture.detectChanges();

    expect(component.imageUrls().length).toBe(1);
    expect(component.imageUrls()[0]).toBe(component.defaultImage);
    expect(component.currentImageUrl()).toBe(component.defaultImage);
  });

  it('should switch selected image thumbnail', () => {
    const fixture = TestBed.createComponent(PropertyDetailComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.selectedImageIndex()).toBe(0);
    expect(component.currentImageUrl()).toBe('https://example.com/cover.jpg');

    component.selectImage(1);
    expect(component.selectedImageIndex()).toBe(1);
    expect(component.currentImageUrl()).toBe('https://example.com/sub1.jpg');
  });

  it('should trigger link sharing and toggle copy toast flag', () => {
    const fixture = TestBed.createComponent(PropertyDetailComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.shareLink();
    expect(component.copiedToast()).toBe(true);
  });
});

