import { Injectable, inject, isDevMode } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  Property,
  PropertyFilterParams,
  PaginatedResult,
  CreatePropertyRequest,
  UpdatePropertyRequest
} from '../models/property.model';

@Injectable({
  providedIn: 'root'
})
export class PropertyService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/properties';

  // Fallback mock data when backend API is unreachable
  private mockProperties: Property[] = [
    {
      id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      ownerId: '3fa85f64-5717-4562-b3fc-2c963f66b111',
      ownerName: 'وكيل عقارات الشهباء',
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
      id: '9b23cd56-2345-5678-90bc-def012345678',
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
      id: '0c34de67-3456-6789-01cd-ef0123456789',
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
      id: '1d45ef78-4567-7890-12de-f01234567890',
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
    },
    {
      id: '2e56fg89-5678-8901-23ef-012345678901',
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
      status: 'Rented',
      isFeatured: false,
      createdAt: '2026-09-22T16:20:00Z'
    },
    {
      id: '3f67gh90-6789-9012-34fg-123456789012',
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
    },
    {
      id: '4g78hi01-7890-0123-45gh-234567890123',
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
  ];

  /**
   * Retrieves a paginated list of properties matching optional filter parameters.
   */
  getProperties(params?: PropertyFilterParams): Observable<PaginatedResult<Property>> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.searchTerm) httpParams = httpParams.set('searchTerm', params.searchTerm);
      if (params.purpose) httpParams = httpParams.set('purpose', params.purpose);
      if (params.city) httpParams = httpParams.set('city', params.city);
      if (params.cityArea) httpParams = httpParams.set('cityArea', params.cityArea);
      if (params.category) httpParams = httpParams.set('category', params.category);
      if (params.minPrice !== undefined && params.minPrice !== null) {
        httpParams = httpParams.set('minPrice', params.minPrice.toString());
      }
      if (params.maxPrice !== undefined && params.maxPrice !== null) {
        httpParams = httpParams.set('maxPrice', params.maxPrice.toString());
      }
      if (params.minArea !== undefined && params.minArea !== null) {
        httpParams = httpParams.set('minArea', params.minArea.toString());
      }
      if (params.maxArea !== undefined && params.maxArea !== null) {
        httpParams = httpParams.set('maxArea', params.maxArea.toString());
      }
      if (params.bedrooms !== undefined && params.bedrooms !== null) {
        httpParams = httpParams.set('bedrooms', params.bedrooms.toString());
      }
      if (params.bathrooms !== undefined && params.bathrooms !== null) {
        httpParams = httpParams.set('bathrooms', params.bathrooms.toString());
      }
      if (params.status) httpParams = httpParams.set('status', params.status);
      if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
      if (params.pageNumber) httpParams = httpParams.set('pageNumber', params.pageNumber.toString());
      if (params.pageSize) httpParams = httpParams.set('pageSize', params.pageSize.toString());
    }

    return this.http.get<PaginatedResult<Property>>(this.apiUrl, { params: httpParams }).pipe(
      catchError((err) => {
        if (isDevMode()) {
          // Fallback to local mock filtering when server unreachable
          return of(this.filterMockProperties(params));
        }
        throw err;
      })
    );
  }

  /**
   * Retrieves single property by ID.
   */
  getPropertyById(id: string): Observable<Property> {
    return this.http.get<Property>(`${this.apiUrl}/${id}`).pipe(
      catchError((err) => {
        if (isDevMode()) {
          const found = this.mockProperties.find(p => p.id === id);
          if (found) {
            return of({
              ...found,
              ownerName: found.ownerName || 'وكيل عقارات الشهباء'
            });
          }
        }
        throw err;
      })
    );
  }

  /**
   * Creates a new property listing.
   */
  createProperty(dto: CreatePropertyRequest): Observable<Property> {
    return this.http.post<Property>(this.apiUrl, dto).pipe(
      catchError((err) => {
        if (isDevMode()) {
          const newProperty: Property = {
            id: `mock-${Date.now()}`,
            ...dto,
            status: 'Available',
            isFeatured: false,
            createdAt: new Date().toISOString()
          };
          this.mockProperties.unshift(newProperty);
          return of(newProperty);
        }
        throw err;
      })
    );
  }

  /**
   * Retrieves all properties owned by current user.
   */
  getMyProperties(): Observable<Property[]> {
    return this.http.get<Property[]>(`${this.apiUrl}/my`).pipe(
      catchError((err) => {
        if (isDevMode()) {
          return of([...this.mockProperties]);
        }
        throw err;
      })
    );
  }

  /**
   * Updates an existing property listing by ID.
   */
  updateProperty(id: string, dto: UpdatePropertyRequest): Observable<Property> {
    return this.http.put<Property>(`${this.apiUrl}/${id}`, dto).pipe(
      catchError((err) => {
        if (isDevMode()) {
          const index = this.mockProperties.findIndex(p => p.id === id);
          if (index !== -1) {
            const updated: Property = {
              ...this.mockProperties[index],
              ...dto,
              status: dto.status || this.mockProperties[index].status
            };
            this.mockProperties[index] = updated;
            return of(updated);
          }
        }
        throw err;
      })
    );
  }

  /**
   * Deletes or archives a property listing by ID.
   */
  deleteProperty(id: string): Observable<{ message: string } | void> {
    return this.http.delete<{ message: string } | void>(`${this.apiUrl}/${id}`).pipe(
      catchError((err) => {
        if (isDevMode()) {
          this.mockProperties = this.mockProperties.filter(p => p.id !== id);
          return of({ message: 'Property deleted successfully.' });
        }
        throw err;
      })
    );
  }

  /**
   * Uploads image files to a property listing.
   */
  uploadImages(propertyId: string, files: File[]): Observable<{ propertyId: string; imageUrls: string[] }> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    return this.http.post<{ propertyId: string; imageUrls: string[] }>(`${this.apiUrl}/${propertyId}/images`, formData).pipe(
      catchError((err) => {
        if (isDevMode()) {
          const mockNewUrls = files.map((file, i) =>
            typeof URL !== 'undefined'
              ? URL.createObjectURL(file)
              : `/uploads/properties/property-${propertyId}-${Date.now()}-${i + 1}.jpg`
          );
          const found = this.mockProperties.find(p => p.id === propertyId);
          if (found) {
            found.imageUrls = [...found.imageUrls, ...mockNewUrls];
            return of({ propertyId, imageUrls: [...found.imageUrls] });
          }
          return of({ propertyId, imageUrls: mockNewUrls });
        }
        throw err;
      })
    );
  }

  /**
   * Deletes an image URL from a property listing.
   */
  deleteImage(propertyId: string, imageUrl: string): Observable<{ propertyId: string; imageUrls: string[] }> {
    return this.http.request<{ propertyId: string; imageUrls: string[] }>('delete', `${this.apiUrl}/${propertyId}/images`, {
      body: { imageUrl }
    }).pipe(
      catchError((err) => {
        if (isDevMode()) {
          const found = this.mockProperties.find(p => p.id === propertyId);
          if (found) {
            found.imageUrls = found.imageUrls.filter(u => u !== imageUrl);
            return of({ propertyId, imageUrls: [...found.imageUrls] });
          }
          return of({ propertyId, imageUrls: [] });
        }
        throw err;
      })
    );
  }

  /**
   * Sets a specific image URL as the primary image for a property listing.
   */
  setPrimaryImage(propertyId: string, imageUrl: string): Observable<{ propertyId: string; primaryImageUrl: string; imageUrls: string[] }> {
    return this.http.put<{ propertyId: string; primaryImageUrl: string; imageUrls: string[] }>(
      `${this.apiUrl}/${propertyId}/images/primary`,
      { imageUrl }
    ).pipe(
      catchError((err) => {
        if (isDevMode()) {
          const found = this.mockProperties.find(p => p.id === propertyId);
          if (found) {
            found.imageUrls = [imageUrl, ...found.imageUrls.filter(u => u !== imageUrl)];
            return of({
              propertyId,
              primaryImageUrl: imageUrl,
              imageUrls: [...found.imageUrls]
            });
          }
          return of({ propertyId, primaryImageUrl: imageUrl, imageUrls: [imageUrl] });
        }
        throw err;
      })
    );
  }

  /**
   * Local filtering logic for fallback mock data.
   */
  private filterMockProperties(params?: PropertyFilterParams): PaginatedResult<Property> {
    let filtered = [...this.mockProperties];

    if (params) {
      if (params.searchTerm && params.searchTerm.trim()) {
        const term = params.searchTerm.trim().toLowerCase();
        filtered = filtered.filter(
          p =>
            p.title.toLowerCase().includes(term) ||
            p.description.toLowerCase().includes(term) ||
            p.address.toLowerCase().includes(term) ||
            p.cityArea.toLowerCase().includes(term) ||
            (p.city && p.city.toLowerCase().includes(term))
        );
      }

      if (params.purpose && params.purpose !== 'all' && params.purpose.trim()) {
        filtered = filtered.filter(
          p => p.purpose?.toLowerCase() === params.purpose!.toLowerCase()
        );
      }

      if (params.city && params.city !== 'all' && params.city.trim()) {
        filtered = filtered.filter(
          p => p.city?.toLowerCase().includes(params.city!.toLowerCase())
        );
      }

      if (params.category && params.category !== 'all' && params.category.trim()) {
        filtered = filtered.filter(
          p => p.category.toLowerCase() === params.category!.toLowerCase()
        );
      }

      if (params.cityArea && params.cityArea !== 'all' && params.cityArea.trim()) {
        filtered = filtered.filter(
          p => p.cityArea.toLowerCase().includes(params.cityArea!.toLowerCase())
        );
      }

      if (params.minPrice !== undefined && params.minPrice !== null && !isNaN(params.minPrice)) {
        filtered = filtered.filter(p => p.price >= params.minPrice!);
      }

      if (params.maxPrice !== undefined && params.maxPrice !== null && !isNaN(params.maxPrice)) {
        filtered = filtered.filter(p => p.price <= params.maxPrice!);
      }

      if (params.minArea !== undefined && params.minArea !== null && !isNaN(params.minArea)) {
        filtered = filtered.filter(p => p.areaSquareMeters >= params.minArea!);
      }

      if (params.maxArea !== undefined && params.maxArea !== null && !isNaN(params.maxArea)) {
        filtered = filtered.filter(p => p.areaSquareMeters <= params.maxArea!);
      }

      if (params.bedrooms !== undefined && params.bedrooms !== null && !isNaN(params.bedrooms)) {
        filtered = filtered.filter(p => p.bedrooms >= params.bedrooms!);
      }

      if (params.bathrooms !== undefined && params.bathrooms !== null && !isNaN(params.bathrooms)) {
        filtered = filtered.filter(p => p.bathrooms >= params.bathrooms!);
      }

      if (params.status && params.status !== 'all' && params.status.trim()) {
        filtered = filtered.filter(
          p => p.status.toLowerCase() === params.status!.toLowerCase()
        );
      }

      if (params.sortBy) {
        switch (params.sortBy) {
          case 'date_asc':
            filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            break;
          case 'price_asc':
            filtered.sort((a, b) => a.price - b.price);
            break;
          case 'price_desc':
            filtered.sort((a, b) => b.price - a.price);
            break;
          case 'area_desc':
            filtered.sort((a, b) => b.areaSquareMeters - a.areaSquareMeters);
            break;
          case 'area_asc':
            filtered.sort((a, b) => a.areaSquareMeters - b.areaSquareMeters);
            break;
          case 'date_desc':
          default:
            filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            break;
        }
      } else {
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
