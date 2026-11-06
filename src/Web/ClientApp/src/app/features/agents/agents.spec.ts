import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AgentService } from '../../core/services/agent.service';
import { AgentListComponent } from './agent-list.component';
import { AgentDetailComponent } from './agent-detail.component';
import { Agent, AgentDetails } from '../../core/models/agent.model';
import { Property, PaginatedResult } from '../../core/models/property.model';

describe('AgentService', () => {
  let service: AgentService;
  let httpMock: HttpTestingController;

  const mockAgent: Agent = {
    id: 'agent-101',
    name: 'محمد الفارس',
    agencyId: 'agency-202',
    agencyName: 'مكتب الشهباء العقاري',
    bio: 'وكيل عقاري مميز في الشهباء',
    publicPhone: '+963911000001',
    address: 'شارع النيل',
    cityArea: 'الشهباء',
    activePropertiesCount: 3
  };

  const mockAgentDetails: AgentDetails = {
    ...mockAgent,
    agencyDescription: 'مكتب خدمات عقارية بحلب',
    agencyPhone: '+963212000001'
  };

  const mockPaginatedAgents: PaginatedResult<Agent> = {
    items: [mockAgent],
    totalCount: 1,
    pageNumber: 1,
    pageSize: 10,
    totalPages: 1
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AgentService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    });

    service = TestBed.inject(AgentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch agents via GET /api/agents', () => {
    service.getAgents({ searchTerm: 'الفارس' }).subscribe((res) => {
      expect(res.items.length).toBe(1);
      expect(res.items[0].name).toBe('محمد الفارس');
    });

    const req = httpMock.expectOne((request) =>
      request.url === '/api/agents' && request.params.get('searchTerm') === 'الفارس'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockPaginatedAgents);
  });

  it('should fallback to dev-mode mock data when GET /api/agents fails', () => {
    service.getAgents().subscribe((res) => {
      expect(res).toBeDefined();
      expect(res.items.length).toBeGreaterThan(0);
    });

    const req = httpMock.expectOne('/api/agents');
    req.error(new ProgressEvent('Network error'));
  });

  it('should fetch single agent details via GET /api/agents/{id}', () => {
    service.getAgentById('agent-101').subscribe((res) => {
      expect(res.name).toBe('محمد الفارس');
      expect(res.publicPhone).toBe('+963911000001');
    });

    const req = httpMock.expectOne('/api/agents/agent-101');
    expect(req.request.method).toBe('GET');
    req.flush(mockAgentDetails);
  });

  it('should fallback to dev-mode mock data when GET /api/agents/{id} fails', () => {
    const mockId = '3fa85f64-5717-4562-b3fc-2c963f66b111';
    service.getAgentById(mockId).subscribe((res) => {
      expect(res).toBeDefined();
      expect(res.id).toBe(mockId);
    });

    const req = httpMock.expectOne(`/api/agents/${mockId}`);
    req.error(new ProgressEvent('Network error'));
  });

  it('should fetch agent properties via GET /api/agents/{id}/properties', () => {
    const mockProperty: Property = {
      id: 'p-1',
      title: 'شقة فاخرة',
      description: 'وصف',
      price: 100000,
      category: 'Apartment',
      cityArea: 'الشهباء',
      address: 'شارع النيل',
      bedrooms: 3,
      bathrooms: 2,
      areaSquareMeters: 150,
      imageUrls: [],
      status: 'Available',
      isFeatured: true,
      createdAt: '2026-09-01T00:00:00Z'
    };

    service.getAgentProperties('agent-101', 1, 6).subscribe((res) => {
      expect(res.items.length).toBe(1);
      expect(res.items[0].title).toBe('شقة فاخرة');
    });

    const req = httpMock.expectOne((r) => r.url === '/api/agents/agent-101/properties');
    expect(req.request.method).toBe('GET');
    req.flush({
      items: [mockProperty],
      totalCount: 1,
      pageNumber: 1,
      pageSize: 6,
      totalPages: 1
    });
  });

  it('should fetch agencies via GET /api/agencies', () => {
    service.getAgencies().subscribe((res) => {
      expect(res.items.length).toBe(1);
      expect(res.items[0].name).toBe('مكتب الشهباء العقاري');
    });

    const req = httpMock.expectOne((r) => r.url === '/api/agencies');
    expect(req.request.method).toBe('GET');
    req.flush({
      items: [{
        id: 'agency-202',
        name: 'مكتب الشهباء العقاري',
        agentsCount: 2,
        activePropertiesCount: 5
      }],
      totalCount: 1,
      pageNumber: 1,
      pageSize: 10,
      totalPages: 1
    });
  });

  it('should update my profile via PUT /api/agents/me', () => {
    const updateDto = { bio: 'سيرة ذاتية جديدة', publicPhone: '+963999888777' };

    service.updateMyProfile(updateDto).subscribe((res) => {
      expect(res.bio).toBe('سيرة ذاتية جديدة');
    });

    const req = httpMock.expectOne('/api/agents/me');
    expect(req.request.method).toBe('PUT');
    req.flush({
      ...mockAgentDetails,
      bio: 'سيرة ذاتية جديدة',
      publicPhone: '+963999888777'
    });
  });
});

describe('AgentListComponent', () => {
  const mockAgent: Agent = {
    id: 'agent-101',
    name: 'محمد الفارس',
    agencyId: 'agency-202',
    agencyName: 'مكتب الشهباء العقاري',
    bio: 'وكيل عقاري مميز في الشهباء',
    publicPhone: '+963911000001',
    address: 'شارع النيل',
    cityArea: 'الشهباء',
    activePropertiesCount: 3
  };

  const mockAgentService = {
    getAgents: vi.fn().mockReturnValue(of({
      items: [mockAgent],
      totalCount: 1,
      pageNumber: 1,
      pageSize: 9,
      totalPages: 1
    }))
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgentListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AgentService, useValue: mockAgentService }
      ]
    }).compileComponents();
  });

  it('should create AgentListComponent', () => {
    const fixture = TestBed.createComponent(AgentListComponent);
    const comp = fixture.componentInstance;
    fixture.detectChanges();
    expect(comp).toBeTruthy();
  });

  it('should load agents on init', () => {
    const fixture = TestBed.createComponent(AgentListComponent);
    const comp = fixture.componentInstance;
    fixture.detectChanges();

    expect(comp.isLoading()).toBe(false);
    expect(comp.agents().length).toBe(1);
    expect(comp.agents()[0].name).toBe('محمد الفارس');
  });

  it('should clear filters correctly', () => {
    const fixture = TestBed.createComponent(AgentListComponent);
    const comp = fixture.componentInstance;
    comp.searchTerm.set('الفارس');
    comp.selectedCityArea.set('الشهباء');

    comp.clearFilters();

    expect(comp.searchTerm()).toBe('');
    expect(comp.selectedCityArea()).toBe('all');
  });
});

describe('AgentDetailComponent', () => {
  const mockAgentDetails: AgentDetails = {
    id: 'agent-101',
    name: 'محمد الفارس',
    agencyId: 'agency-202',
    agencyName: 'مكتب الشهباء العقاري',
    bio: 'وكيل عقاري مميز في الشهباء',
    publicPhone: '+963911000001',
    address: 'شارع النيل',
    cityArea: 'الشهباء',
    activePropertiesCount: 1
  };

  const mockProperty: Property = {
    id: 'p-1',
    title: 'شقة فاخرة للبيع',
    description: 'وصف عقار',
    price: 250000,
    category: 'Apartment',
    cityArea: 'الشهباء',
    address: 'شارع النيل',
    bedrooms: 3,
    bathrooms: 2,
    areaSquareMeters: 180,
    imageUrls: [],
    status: 'Available',
    isFeatured: true,
    createdAt: '2026-09-01T00:00:00Z'
  };

  const mockAgentServiceSuccess = {
    getAgentById: vi.fn().mockReturnValue(of(mockAgentDetails)),
    getAgentProperties: vi.fn().mockReturnValue(of({
      items: [mockProperty],
      totalCount: 1,
      pageNumber: 1,
      pageSize: 6,
      totalPages: 1
    }))
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgentDetailComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AgentService, useValue: mockAgentServiceSuccess },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of({ get: (key: string) => key === 'id' ? 'agent-101' : null }),
            queryParams: of({})
          }
        }
      ]
    }).compileComponents();
  });

  it('should create AgentDetailComponent', () => {
    const fixture = TestBed.createComponent(AgentDetailComponent);
    const comp = fixture.componentInstance;
    fixture.detectChanges();
    expect(comp).toBeTruthy();
  });

  it('should load agent profile details and properties on init', () => {
    const fixture = TestBed.createComponent(AgentDetailComponent);
    const comp = fixture.componentInstance;
    fixture.detectChanges();

    expect(comp.isLoadingAgent()).toBe(false);
    expect(comp.agent()).toBeTruthy();
    expect(comp.agent()?.name).toBe('محمد الفارس');
    expect(comp.properties().length).toBe(1);
  });
});

describe('AgentDetailComponent 404 Handling', () => {
  const mockAgentService404 = {
    getAgentById: vi.fn().mockReturnValue(throwError(() => ({ status: 404 }))),
    getAgentProperties: vi.fn().mockReturnValue(of({
      items: [],
      totalCount: 0,
      pageNumber: 1,
      pageSize: 6,
      totalPages: 1
    }))
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgentDetailComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AgentService, useValue: mockAgentService404 },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of({ get: (key: string) => key === 'id' ? 'non-existent-agent' : null }),
            queryParams: of({})
          }
        }
      ]
    }).compileComponents();
  });

  it('should set 404 state when agent is not found', () => {
    const fixture = TestBed.createComponent(AgentDetailComponent);
    const comp = fixture.componentInstance;
    fixture.detectChanges();

    expect(comp.is404()).toBe(true);
    expect(comp.isLoadingAgent()).toBe(false);
  });
});
