import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { FavoriteService } from '../../core/services/favorite.service';
import { FavoritesComponent } from './favorites.component';
import { Property } from '../../core/models/property.model';
import { of } from 'rxjs';

describe('FavoriteService', () => {
  let service: FavoriteService;
  let httpMock: HttpTestingController;

  const mockProperty: Property = {
    id: 'prop-101',
    title: 'شقة فاخرة للبيع في الشهباء',
    description: 'وصف عقار تجريبي',
    price: 300000,
    category: 'Apartment',
    cityArea: 'الشهباء',
    address: 'شارع النيل',
    bedrooms: 3,
    bathrooms: 2,
    areaSquareMeters: 190,
    imageUrls: ['https://example.com/photo.jpg'],
    status: 'Available',
    isFeatured: true,
    createdAt: new Date().toISOString()
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FavoriteService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    });
    service = TestBed.inject(FavoriteService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch user favorites via GET /api/favorites', () => {
    service.loadFavorites().subscribe((res) => {
      expect(res).toEqual([mockProperty]);
      expect(service.isFavorite('prop-101')).toBe(true);
      expect(service.favoritesCount()).toBe(1);
    });

    const req = httpMock.expectOne('/api/favorites');
    expect(req.request.method).toBe('GET');
    req.flush([mockProperty]);
  });

  it('should fallback to dev-mode stored favorites when GET fails', () => {
    service.loadFavorites().subscribe((res) => {
      expect(res).toBeDefined();
    });

    const req = httpMock.expectOne('/api/favorites');
    req.error(new ProgressEvent('Network error'));
  });

  it('should add favorite via POST /api/favorites/{id}', () => {
    service.addFavorite(mockProperty).subscribe((res) => {
      expect(res.isFavorite).toBe(true);
      expect(service.isFavorite('prop-101')).toBe(true);
    });

    const req = httpMock.expectOne('/api/favorites/prop-101');
    expect(req.request.method).toBe('POST');
    req.flush({ propertyId: 'prop-101', isFavorite: true });
  });

  it('should remove favorite via DELETE /api/favorites/{id}', () => {
    service.favorites.set([mockProperty]);
    expect(service.isFavorite('prop-101')).toBe(true);

    service.removeFavorite('prop-101').subscribe((res) => {
      expect(res.isFavorite).toBe(false);
      expect(service.isFavorite('prop-101')).toBe(false);
    });

    const req = httpMock.expectOne('/api/favorites/prop-101');
    expect(req.request.method).toBe('DELETE');
    req.flush({ propertyId: 'prop-101', isFavorite: false });
  });

  it('should toggle favorite status correctly', () => {
    service.favorites.set([]);

    service.toggleFavorite(mockProperty).subscribe(() => {
      expect(service.isFavorite('prop-101')).toBe(true);
    });

    const req1 = httpMock.expectOne('/api/favorites/prop-101');
    expect(req1.request.method).toBe('POST');
    req1.flush({ propertyId: 'prop-101', isFavorite: true });
  });
});

describe('FavoritesComponent', () => {
  let mockFavoriteService: Partial<FavoriteService>;

  beforeEach(async () => {
    mockFavoriteService = {
      favorites: createSignal<Property[]>([]),
      loading: createSignal<boolean>(false),
      favoriteIds: createSignal<Set<string>>(new Set()),
      favoritesCount: createSignal<number>(0),
      loadFavorites: () => of([])
    } as any;

    await TestBed.configureTestingModule({
      imports: [FavoritesComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: FavoriteService, useValue: mockFavoriteService }
      ]
    }).compileComponents();
  });

  it('should create favorites component', () => {
    const fixture = TestBed.createComponent(FavoritesComponent);
    const comp = fixture.componentInstance;
    fixture.detectChanges();
    expect(comp).toBeTruthy();
  });
});

function createSignal<T>(initialValue: T) {
  let val = initialValue;
  const sig = () => val;
  sig.set = (newVal: T) => { val = newVal; };
  return sig;
}
