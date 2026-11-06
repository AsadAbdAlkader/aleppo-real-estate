import { Injectable, inject, isDevMode } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  Agent,
  AgentDetails,
  Agency,
  AgencyDetails,
  AgentFilterParams,
  UpdateAgentProfileDto,
  CreateAgencyDto,
  UpdateAgencyDto
} from '../models/agent.model';
import { Property, PaginatedResult } from '../models/property.model';

@Injectable({
  providedIn: 'root'
})
export class AgentService {
  private readonly http = inject(HttpClient);
  private readonly agentsApiUrl = '/api/agents';
  private readonly agenciesApiUrl = '/api/agencies';

  // Fallback mock data for Agencies
  private mockAgencies: AgencyDetails[] = [
    {
      id: '3fa85f64-5717-4562-b3fc-2c963f66b222',
      name: 'مكتب الشهباء العقاري',
      description: 'أعرق مكتب عقاري في حي الشهباء بحلب، متخصصون في بيع وشراء وتأجير العقارات السكنية والتجارية والاستثمارات الراقية.',
      phoneNumber: '+963212000001',
      address: 'حي الشهباء - شارع النيل - قرب الحديقة العامة',
      cityArea: 'الشهباء',
      logoUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&auto=format&fit=crop',
      licenseNumber: 'ALE-AGENCY-01',
      agentsCount: 2,
      activePropertiesCount: 5,
      createdAt: '2026-09-01T10:00:00Z'
    },
    {
      id: '3fa85f64-5717-4562-b3fc-2c963f66b333',
      name: 'مؤسسة العزيزية للخدمات العقارية',
      description: 'تقديم الاستشارات والعقود العقارية الموثوقة بكافة مناطق العزيزية والسريان والمحافظة.',
      phoneNumber: '+963212223334',
      address: 'حي العزيزية - شارع القوتلي',
      cityArea: 'العزيزية',
      logoUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop',
      licenseNumber: 'ALE-AGENCY-02',
      agentsCount: 1,
      activePropertiesCount: 3,
      createdAt: '2026-09-05T12:30:00Z'
    },
    {
      id: '3fa85f64-5717-4562-b3fc-2c963f66b444',
      name: 'مجموعة حلب الاستثمارية',
      description: 'مجموعة متخصصة في تسويق المجمعات والأراضي الاستثمارية والتجارية والمشاريع السكنية الحديثة.',
      phoneNumber: '+963212555666',
      address: 'حي السبيل - قرب دوار السبيل',
      cityArea: 'السبيل',
      logoUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop',
      licenseNumber: 'ALE-AGENCY-04',
      agentsCount: 1,
      activePropertiesCount: 2,
      createdAt: '2026-09-15T15:00:00Z'
    }
  ];

  // Fallback mock data for Agents
  private mockAgents: AgentDetails[] = [
    {
      id: '3fa85f64-5717-4562-b3fc-2c963f66b111',
      name: 'محمد الفارس',
      agencyId: '3fa85f64-5717-4562-b3fc-2c963f66b222',
      agencyName: 'مكتب الشهباء العقاري',
      agencyDescription: 'أعرق مكتب عقاري في حي الشهباء بحلب، متخصصون في بيع وشراء وتأجير العقارات السكنية والتجارية.',
      bio: 'وكيل عقاري خبرة 15 عاماً في سوق العقارات بحلب، متخصص في الفلل والشقق الفاخرة في الشهباء والسبيل.',
      publicPhone: '+963911000001',
      agencyPhone: '+963212000001',
      address: 'حي الشهباء - شارع النيل',
      cityArea: 'الشهباء',
      logoUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&auto=format&fit=crop',
      licenseNumber: 'ALE-AGENCY-01',
      activePropertiesCount: 3,
      createdAt: '2026-09-01T10:00:00Z'
    },
    {
      id: '8a12bc45-1234-4567-89ab-cdef01234567',
      name: 'أحمد الحلبي',
      agencyId: '3fa85f64-5717-4562-b3fc-2c963f66b333',
      agencyName: 'مؤسسة العزيزية للخدمات العقارية',
      agencyDescription: 'تقديم الاستشارات والعقود العقارية الموثوقة بكافة مناطق العزيزية والسريان.',
      bio: 'مستشار عقاري متخصص في العقارات التجارية والمكاتب في العزيزية والسريان والمحافظة.',
      publicPhone: '+963922111222',
      agencyPhone: '+963212223334',
      address: 'حي العزيزية - شارع القوتلي',
      cityArea: 'العزيزية',
      logoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop',
      licenseNumber: 'ALE-AGENCY-02',
      activePropertiesCount: 2,
      createdAt: '2026-09-05T12:30:00Z'
    },
    {
      id: '9b23cd56-2345-5678-90bc-def012345678',
      name: 'سامر الكاتب',
      agencyId: null,
      agencyName: 'مستقل',
      agencyDescription: null,
      bio: 'وكيل عقاري مستقل يُغطي مناطق الفرقان والسبيل وحلب الجديدة. خبير في تثمين وتقييم العقارات.',
      publicPhone: '+963933222333',
      agencyPhone: null,
      address: 'حي الفرقان - شارع الجامعة',
      cityArea: 'الفرقان',
      logoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop',
      licenseNumber: 'ALE-IND-03',
      activePropertiesCount: 2,
      createdAt: '2026-09-10T09:15:00Z'
    },
    {
      id: '0c34de67-3456-6789-01cd-ef0123456789',
      name: 'رنا العطار',
      agencyId: '3fa85f64-5717-4562-b3fc-2c963f66b444',
      agencyName: 'مجموعة حلب الاستثمارية',
      agencyDescription: 'مجموعة متخصصة في تسويق المجمعات والأراضي الاستثمارية.',
      bio: 'متخصصة في الأراضي الاستثمارية والمشاريع السكنية والتجارية الحديثة بحلب.',
      publicPhone: '+963944333444',
      agencyPhone: '+963212555666',
      address: 'حي السبيل - قرب دوار السبيل',
      cityArea: 'السبيل',
      logoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop',
      licenseNumber: 'ALE-AGENCY-04',
      activePropertiesCount: 1,
      createdAt: '2026-09-15T15:00:00Z'
    }
  ];

  // Fallback mock properties linked to agents
  private mockAgentProperties: Record<string, Property[]> = {
    '3fa85f64-5717-4562-b3fc-2c963f66b111': [
      {
        id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        ownerId: '3fa85f64-5717-4562-b3fc-2c963f66b111',
        ownerName: 'محمد الفارس',
        title: 'شقة فاخرة للبيع في حي الشهباء',
        description: 'شقة سكنية مميزة بتشطيبات عالية الجودة، إطلالة رائعة على شارع النيل وموقع هادئ قريب من الخدمات.',
        price: 250000,
        category: 'Apartment',
        purpose: 'Sale',
        city: 'حلب',
        cityArea: 'الشهباء',
        address: 'شارع النيل - قرب الحديقة العامة',
        bedrooms: 3,
        bathrooms: 2,
        areaSquareMeters: 180.5,
        imageUrls: [
          'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&auto=format&fit=crop'
        ],
        status: 'Available',
        isFeatured: true,
        createdAt: '2026-09-27T12:00:00Z'
      },
      {
        id: '8a12bc45-1234-4567-89ab-cdef01234567',
        ownerId: '3fa85f64-5717-4562-b3fc-2c963f66b111',
        ownerName: 'محمد الفارس',
        title: 'فيلا مستقلة مع حديقة ومسبح في الشهباء الجديدة',
        description: 'فيلا راقية مبنية على طراز حديث تضم حديقة واسعة ومسبح خاص مع كراج يتسع لثلاث سيارات.',
        price: 650000,
        category: 'Villa',
        purpose: 'Sale',
        city: 'حلب',
        cityArea: 'الشهباء',
        address: 'الشهباء الجديدة - كشوفات أورينت',
        bedrooms: 5,
        bathrooms: 4,
        areaSquareMeters: 420.0,
        imageUrls: [
          'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&auto=format&fit=crop'
        ],
        status: 'Available',
        isFeatured: true,
        createdAt: '2026-09-26T10:30:00Z'
      },
      {
        id: '4g78hi01-7890-0123-45gh-234567890123',
        ownerId: '3fa85f64-5717-4562-b3fc-2c963f66b111',
        ownerName: 'محمد الفارس',
        title: 'شقة دوبلكس فاخرة في المحافظة',
        description: 'دوبلكس طابقين مع تراس واسع وإطلالة ممتازة في أرقى مناطق المحافظة.',
        price: 320000,
        category: 'Apartment',
        purpose: 'Rent',
        city: 'حلب',
        cityArea: 'المحافظة',
        address: 'حي المحافظة - قرب القنصلية',
        bedrooms: 4,
        bathrooms: 3,
        areaSquareMeters: 260.0,
        imageUrls: [
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop'
        ],
        status: 'Available',
        isFeatured: true,
        createdAt: '2026-09-20T17:00:00Z'
      }
    ],
    '8a12bc45-1234-4567-89ab-cdef01234567': [
      {
        id: '9b23cd56-2345-5678-90bc-def012345678',
        ownerId: '8a12bc45-1234-4567-89ab-cdef01234567',
        ownerName: 'أحمد الحلبي',
        title: 'مكتب تجاري مجهز بالكامل في العزيزية',
        description: 'مكتب تجاري فاخر في قلب حي العزيزية التجاري، مناسب لشركة هندسية أو عيادة طليعة.',
        price: 120000,
        category: 'Commercial',
        purpose: 'Rent',
        city: 'حلب',
        cityArea: 'العزيزية',
        address: 'شارع القوتلي - بناء الاستثمار',
        bedrooms: 0,
        bathrooms: 2,
        areaSquareMeters: 110.0,
        imageUrls: [
          'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop'
        ],
        status: 'Available',
        isFeatured: false,
        createdAt: '2026-09-25T14:15:00Z'
      },
      {
        id: '2e56fg89-5678-8901-23ef-012345678901',
        ownerId: '8a12bc45-1234-4567-89ab-cdef01234567',
        ownerName: 'أحمد الحلبي',
        title: 'شقة مفروشة راقية في السريان القديم',
        description: 'شقة مفروشة بأثاث مودرن وتجهيزات كاملة في موقع حيوي وهادئ.',
        price: 140000,
        category: 'Apartment',
        purpose: 'Rent',
        city: 'حلب',
        cityArea: 'السريان',
        address: 'السريان القديم - خلف مشفى اليرموك',
        bedrooms: 2,
        bathrooms: 1,
        areaSquareMeters: 105.0,
        imageUrls: [
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop'
        ],
        status: 'Available',
        isFeatured: false,
        createdAt: '2026-09-22T16:20:00Z'
      }
    ],
    '9b23cd56-2345-5678-90bc-def012345678': [
      {
        id: '0c34de67-3456-6789-01cd-ef0123456789',
        ownerId: '9b23cd56-2345-5678-90bc-def012345678',
        ownerName: 'سامر الكاتب',
        title: 'شقة حديثة البناء بالقرب من جامعة حلب',
        description: 'شقة سكنية ممتازة في حي الفرقان قريبة من الجامعة والخدمات الطبية والتجارية.',
        price: 185000,
        category: 'Apartment',
        purpose: 'Sale',
        city: 'حلب',
        cityArea: 'الفرقان',
        address: 'حي الفرقان - شارع أدونيس',
        bedrooms: 3,
        bathrooms: 2,
        areaSquareMeters: 145.0,
        imageUrls: [
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop'
        ],
        status: 'Available',
        isFeatured: false,
        createdAt: '2026-09-24T09:00:00Z'
      },
      {
        id: '3f67gh90-6789-9012-34fg-123456789012',
        ownerId: '9b23cd56-2345-5678-90bc-def012345678',
        ownerName: 'سامر الكاتب',
        title: 'دكان تجاري على الشارع العام في حلب الجديدة',
        description: 'محل تجاري مع واجهة زجاجية عريضة واجهة على الشارع الرئيسي في حلب الجديدة.',
        price: 210000,
        category: 'Commercial',
        purpose: 'Sale',
        city: 'حلب',
        cityArea: 'حلب الجديدة',
        address: 'حلب الجديدة - الشارع الرئيسي',
        bedrooms: 0,
        bathrooms: 1,
        areaSquareMeters: 75.0,
        imageUrls: [
          'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800&auto=format&fit=crop'
        ],
        status: 'Available',
        isFeatured: false,
        createdAt: '2026-09-21T13:10:00Z'
      }
    ],
    '0c34de67-3456-6789-01cd-ef0123456789': [
      {
        id: '1d45ef78-4567-7890-12de-f01234567890',
        ownerId: '0c34de67-3456-6789-01cd-ef0123456789',
        ownerName: 'رنا العطار',
        title: 'أرض استثمارية معدة للبناء في السبيل',
        description: 'قطعة أرض ممتازة ترخيص سكني تجاري تقع على شارعين رئيسيين في حي السبيل.',
        price: 480000,
        category: 'Land',
        purpose: 'Sale',
        city: 'حلب',
        cityArea: 'السبيل',
        address: 'حي السبيل - قرب دوار السبيل',
        bedrooms: 0,
        bathrooms: 0,
        areaSquareMeters: 550.0,
        imageUrls: [
          'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop'
        ],
        status: 'Available',
        isFeatured: true,
        createdAt: '2026-09-23T11:45:00Z'
      }
    ]
  };

  /**
   * Retrieves a paginated list of real estate agents matching optional search and filter parameters.
   */
  getAgents(params?: AgentFilterParams): Observable<PaginatedResult<Agent>> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.searchTerm) httpParams = httpParams.set('searchTerm', params.searchTerm);
      if (params.cityArea) httpParams = httpParams.set('cityArea', params.cityArea);
      if (params.pageNumber) httpParams = httpParams.set('pageNumber', params.pageNumber.toString());
      if (params.pageSize) httpParams = httpParams.set('pageSize', params.pageSize.toString());
    }

    return this.http.get<PaginatedResult<Agent>>(this.agentsApiUrl, { params: httpParams }).pipe(
      catchError((err) => {
        if (isDevMode()) {
          return of(this.filterMockAgents(params));
        }
        return throwError(() => err);
      })
    );
  }

  /**
   * Retrieves detailed profile information for a single agent by ID.
   */
  getAgentById(id: string): Observable<AgentDetails> {
    return this.http.get<AgentDetails>(`${this.agentsApiUrl}/${id}`).pipe(
      catchError((err) => {
        if (isDevMode()) {
          const found = this.mockAgents.find(a => a.id === id);
          if (found) {
            return of({ ...found });
          }
        }
        return throwError(() => err);
      })
    );
  }

  /**
   * Retrieves paginated active properties for a specific agent by agent user ID.
   */
  getAgentProperties(id: string, pageNumber: number = 1, pageSize: number = 6): Observable<PaginatedResult<Property>> {
    let httpParams = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<PaginatedResult<Property>>(`${this.agentsApiUrl}/${id}/properties`, { params: httpParams }).pipe(
      catchError((err) => {
        if (isDevMode()) {
          const propertiesList = this.mockAgentProperties[id] || [];
          const totalCount = propertiesList.length;
          const totalPages = Math.ceil(totalCount / pageSize) || 1;
          const startIndex = (pageNumber - 1) * pageSize;
          const items = propertiesList.slice(startIndex, startIndex + pageSize);

          return of({
            items,
            totalCount,
            pageNumber,
            pageSize,
            totalPages
          });
        }
        return throwError(() => err);
      })
    );
  }

  /**
   * Updates the current authenticated agent's profile details.
   */
  updateMyProfile(dto: UpdateAgentProfileDto): Observable<AgentDetails> {
    return this.http.put<AgentDetails>(`${this.agentsApiUrl}/me`, dto).pipe(
      catchError((err) => {
        if (isDevMode()) {
          const mockAgent = this.mockAgents[0];
          const updated: AgentDetails = {
            ...mockAgent,
            bio: dto.bio ?? mockAgent.bio,
            publicPhone: dto.publicPhone ?? mockAgent.publicPhone,
            agencyId: dto.agencyId !== undefined ? dto.agencyId : mockAgent.agencyId
          };
          this.mockAgents[0] = updated;
          return of(updated);
        }
        return throwError(() => err);
      })
    );
  }

  /**
   * Retrieves a paginated list of real estate agencies.
   */
  getAgencies(pageNumber: number = 1, pageSize: number = 10): Observable<PaginatedResult<Agency>> {
    let httpParams = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<PaginatedResult<Agency>>(this.agenciesApiUrl, { params: httpParams }).pipe(
      catchError((err) => {
        if (isDevMode()) {
          const totalCount = this.mockAgencies.length;
          const totalPages = Math.ceil(totalCount / pageSize) || 1;
          const startIndex = (pageNumber - 1) * pageSize;
          const items = this.mockAgencies.slice(startIndex, startIndex + pageSize);

          return of({
            items,
            totalCount,
            pageNumber,
            pageSize,
            totalPages
          });
        }
        return throwError(() => err);
      })
    );
  }

  /**
   * Retrieves detailed information for a single agency by ID.
   */
  getAgencyById(id: string): Observable<AgencyDetails> {
    return this.http.get<AgencyDetails>(`${this.agenciesApiUrl}/${id}`).pipe(
      catchError((err) => {
        if (isDevMode()) {
          const agency = this.mockAgencies.find(a => a.id === id);
          if (agency) {
            const agencyAgents = this.mockAgents.filter(ag => ag.agencyId === id);
            return of({
              ...agency,
              agents: agencyAgents
            });
          }
        }
        return throwError(() => err);
      })
    );
  }

  /**
   * Creates a new real estate agency.
   */
  createAgency(dto: CreateAgencyDto): Observable<Agency> {
    return this.http.post<Agency>(this.agenciesApiUrl, dto).pipe(
      catchError((err) => {
        if (isDevMode()) {
          const newAgency: AgencyDetails = {
            id: 'agency-dev-' + Date.now(),
            name: dto.name,
            description: dto.description ?? null,
            phoneNumber: dto.phoneNumber ?? null,
            address: dto.address ?? null,
            cityArea: dto.cityArea ?? null,
            logoUrl: dto.logoUrl ?? 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&auto=format&fit=crop',
            licenseNumber: dto.licenseNumber ?? null,
            agentsCount: 1,
            activePropertiesCount: 0,
            createdAt: new Date().toISOString()
          };
          this.mockAgencies.unshift(newAgency);
          return of(newAgency);
        }
        return throwError(() => err);
      })
    );
  }

  /**
   * Updates an existing real estate agency.
   */
  updateAgency(id: string, dto: UpdateAgencyDto): Observable<Agency> {
    return this.http.put<Agency>(`${this.agenciesApiUrl}/${id}`, dto).pipe(
      catchError((err) => {
        if (isDevMode()) {
          const index = this.mockAgencies.findIndex(a => a.id === id);
          if (index !== -1) {
            const updated: AgencyDetails = {
              ...this.mockAgencies[index],
              name: dto.name ?? this.mockAgencies[index].name,
              description: dto.description !== undefined ? dto.description : this.mockAgencies[index].description,
              phoneNumber: dto.phoneNumber !== undefined ? dto.phoneNumber : this.mockAgencies[index].phoneNumber,
              address: dto.address !== undefined ? dto.address : this.mockAgencies[index].address,
              cityArea: dto.cityArea !== undefined ? dto.cityArea : this.mockAgencies[index].cityArea,
              logoUrl: dto.logoUrl !== undefined ? dto.logoUrl : this.mockAgencies[index].logoUrl,
              licenseNumber: dto.licenseNumber !== undefined ? dto.licenseNumber : this.mockAgencies[index].licenseNumber
            };
            this.mockAgencies[index] = updated;
            return of(updated);
          }
        }
        return throwError(() => err);
      })
    );
  }


  /**
   * Helper filter for dev-mode mock agent search.
   */
  private filterMockAgents(params?: AgentFilterParams): PaginatedResult<Agent> {
    let filtered = [...this.mockAgents];

    if (params) {
      if (params.searchTerm && params.searchTerm.trim()) {
        const term = params.searchTerm.trim().toLowerCase();
        filtered = filtered.filter(a =>
          a.name.toLowerCase().includes(term) ||
          (a.agencyName && a.agencyName.toLowerCase().includes(term)) ||
          (a.bio && a.bio.toLowerCase().includes(term)) ||
          (a.cityArea && a.cityArea.toLowerCase().includes(term))
        );
      }

      if (params.cityArea && params.cityArea !== 'all' && params.cityArea.trim()) {
        filtered = filtered.filter(a =>
          a.cityArea && a.cityArea.toLowerCase().includes(params.cityArea!.toLowerCase())
        );
      }
    }

    const pageNumber = params?.pageNumber || 1;
    const pageSize = params?.pageSize || 10;
    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    const startIndex = (pageNumber - 1) * pageSize;
    const items = filtered.slice(startIndex, startIndex + pageSize);

    return {
      items,
      totalCount,
      pageNumber,
      pageSize,
      totalPages
    };
  }
}
