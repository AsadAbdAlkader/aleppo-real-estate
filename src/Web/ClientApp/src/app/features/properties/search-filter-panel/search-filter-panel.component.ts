import { Component, OnInit, OnDestroy, signal, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PropertyFilterParams } from '../../../core/models/property.model';

@Component({
  selector: 'app-search-filter-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-filter-panel.component.html',
  styleUrls: []
})
export class SearchFilterPanelComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private queryParamsSub?: Subscription;

  // Output event for parent component if needed
  readonly filterChange = output<PropertyFilterParams>();

  // Reactive State Signals for filters
  searchTerm = signal<string>('');
  purpose = signal<string>('all');
  city = signal<string>('all');
  cityArea = signal<string>('all');
  category = signal<string>('all');
  minPrice = signal<number | null>(null);
  maxPrice = signal<number | null>(null);
  minArea = signal<number | null>(null);
  maxArea = signal<number | null>(null);
  bedrooms = signal<number | null>(null);
  bathrooms = signal<number | null>(null);
  sortBy = signal<string>('date_desc');

  // UI state signal for advanced filters expansion
  showAdvanced = signal<boolean>(false);

  // Purpose options
  readonly purposeTabs = [
    { id: 'all', label: 'الكل' },
    { id: 'Sale', label: 'للبيع' },
    { id: 'Rent', label: 'للإيجار' }
  ];

  // City options
  readonly cities = [
    { id: 'all', label: 'كافة المدن' },
    { id: 'حلب', label: 'حلب' }
  ];

  // Neighborhood options in Aleppo
  readonly cityAreas = [
    { id: 'all', label: 'كافة الأحياء' },
    { id: 'الشهباء', label: 'الشهباء' },
    { id: 'العزيزية', label: 'العزيزية' },
    { id: 'الفرقان', label: 'الفرقان' },
    { id: 'السبيل', label: 'السبيل' },
    { id: 'السريان', label: 'السريان' },
    { id: 'المحافظة', label: 'المحافظة' },
    { id: 'حلب الجديدة', label: 'حلب الجديدة' }
  ];

  // Category options
  readonly categories = [
    { id: 'all', label: 'جميع التصنيفات' },
    { id: 'Apartment', label: 'شقة' },
    { id: 'Villa', label: 'فيلا' },
    { id: 'Commercial', label: 'مكتب تجاري' },
    { id: 'Land', label: 'أرض' }
  ];

  // Bedroom options
  readonly bedroomOptions = [
    { id: null, label: 'الكل' },
    { id: 1, label: '1+' },
    { id: 2, label: '2+' },
    { id: 3, label: '3+' },
    { id: 4, label: '4+' },
    { id: 5, label: '5+' }
  ];

  // Bathroom options
  readonly bathroomOptions = [
    { id: null, label: 'الكل' },
    { id: 1, label: '1+' },
    { id: 2, label: '2+' },
    { id: 3, label: '3+' },
    { id: 4, label: '4+' }
  ];

  // Sorting options
  readonly sortOptions = [
    { id: 'date_desc', label: 'الأحدث أولاً' },
    { id: 'date_asc', label: 'الأقدم أولاً' },
    { id: 'price_asc', label: 'السعر: من الأقل للأعلى' },
    { id: 'price_desc', label: 'السعر: من الأعلى للأقل' },
    { id: 'area_desc', label: 'المساحة: من الأكبر للأصغر' },
    { id: 'area_asc', label: 'المساحة: من الأصغر للأكبر' }
  ];

  ngOnInit(): void {
    // Bi-directional binding: Read URL query parameters and update signals
    this.queryParamsSub = this.route.queryParams.subscribe(params => {
      this.searchTerm.set(params['searchTerm'] || '');
      this.purpose.set(params['purpose'] || 'all');
      this.city.set(params['city'] || 'all');
      this.cityArea.set(params['cityArea'] || 'all');
      this.category.set(params['category'] || 'all');
      this.minPrice.set(params['minPrice'] != null && params['minPrice'] !== '' ? Number(params['minPrice']) : null);
      this.maxPrice.set(params['maxPrice'] != null && params['maxPrice'] !== '' ? Number(params['maxPrice']) : null);
      this.minArea.set(params['minArea'] != null && params['minArea'] !== '' ? Number(params['minArea']) : null);
      this.maxArea.set(params['maxArea'] != null && params['maxArea'] !== '' ? Number(params['maxArea']) : null);
      this.bedrooms.set(params['bedrooms'] != null && params['bedrooms'] !== '' ? Number(params['bedrooms']) : null);
      this.bathrooms.set(params['bathrooms'] != null && params['bathrooms'] !== '' ? Number(params['bathrooms']) : null);
      this.sortBy.set(params['sortBy'] || 'date_desc');

      // Auto-expand advanced filters if any advanced param is set
      if (
        params['minArea'] || params['maxArea'] ||
        params['bedrooms'] || params['bathrooms'] ||
        (params['sortBy'] && params['sortBy'] !== 'date_desc')
      ) {
        this.showAdvanced.set(true);
      }
    });
  }

  ngOnDestroy(): void {
    this.queryParamsSub?.unsubscribe();
  }

  // Set purpose tab
  setPurpose(value: string): void {
    this.purpose.set(value);
    this.syncToUrl();
  }

  // Set city
  onCityChange(value: string): void {
    this.city.set(value);
    this.syncToUrl();
  }

  // Set city area / neighborhood
  onCityAreaChange(value: string): void {
    this.cityArea.set(value);
    this.syncToUrl();
  }

  // Set category
  onCategoryChange(value: string): void {
    this.category.set(value);
    this.syncToUrl();
  }

  // Set search term
  onSearchTermChange(value: string): void {
    this.searchTerm.set(value);
    this.syncToUrl();
  }

  // Set price min
  onMinPriceChange(value: number | null): void {
    this.minPrice.set(value);
    this.syncToUrl();
  }

  // Set price max
  onMaxPriceChange(value: number | null): void {
    this.maxPrice.set(value);
    this.syncToUrl();
  }

  // Set area min
  onMinAreaChange(value: number | null): void {
    this.minArea.set(value);
    this.syncToUrl();
  }

  // Set area max
  onMaxAreaChange(value: number | null): void {
    this.maxArea.set(value);
    this.syncToUrl();
  }

  // Set bedrooms
  setBedrooms(value: number | null): void {
    this.bedrooms.set(value);
    this.syncToUrl();
  }

  // Set bathrooms
  setBathrooms(value: number | null): void {
    this.bathrooms.set(value);
    this.syncToUrl();
  }

  // Set sorting
  onSortByChange(value: string): void {
    this.sortBy.set(value);
    this.syncToUrl();
  }

  // Toggle advanced filters view
  toggleAdvanced(): void {
    this.showAdvanced.set(!this.showAdvanced());
  }

  // Reset all filters to default state
  clearFilters(): void {
    this.searchTerm.set('');
    this.purpose.set('all');
    this.city.set('all');
    this.cityArea.set('all');
    this.category.set('all');
    this.minPrice.set(null);
    this.maxPrice.set(null);
    this.minArea.set(null);
    this.maxArea.set(null);
    this.bedrooms.set(null);
    this.bathrooms.set(null);
    this.sortBy.set('date_desc');

    this.syncToUrl();
  }

  // Submit search (force navigate to /properties if on landing page)
  onSearchSubmit(): void {
    this.syncToUrl(true);
  }

  // Helper method to sync component filter state to URL Query Parameters
  private syncToUrl(forceNavigateToProperties: boolean = false): void {
    const filterParams: PropertyFilterParams = {
      searchTerm: this.searchTerm().trim() || undefined,
      purpose: this.purpose() !== 'all' ? this.purpose() : undefined,
      city: this.city() !== 'all' ? this.city() : undefined,
      cityArea: this.cityArea() !== 'all' ? this.cityArea() : undefined,
      category: this.category() !== 'all' ? this.category() : undefined,
      minPrice: this.minPrice() !== null && !isNaN(this.minPrice()!) ? this.minPrice()! : undefined,
      maxPrice: this.maxPrice() !== null && !isNaN(this.maxPrice()!) ? this.maxPrice()! : undefined,
      minArea: this.minArea() !== null && !isNaN(this.minArea()!) ? this.minArea()! : undefined,
      maxArea: this.maxArea() !== null && !isNaN(this.maxArea()!) ? this.maxArea()! : undefined,
      bedrooms: this.bedrooms() !== null ? this.bedrooms()! : undefined,
      bathrooms: this.bathrooms() !== null ? this.bathrooms()! : undefined,
      sortBy: this.sortBy() !== 'date_desc' ? this.sortBy() : undefined,
      pageNumber: 1
    };

    const queryParams: Record<string, any> = {
      searchTerm: filterParams.searchTerm || null,
      purpose: filterParams.purpose || null,
      city: filterParams.city || null,
      cityArea: filterParams.cityArea || null,
      category: filterParams.category || null,
      minPrice: filterParams.minPrice ?? null,
      maxPrice: filterParams.maxPrice ?? null,
      minArea: filterParams.minArea ?? null,
      maxArea: filterParams.maxArea ?? null,
      bedrooms: filterParams.bedrooms ?? null,
      bathrooms: filterParams.bathrooms ?? null,
      sortBy: filterParams.sortBy || null,
      pageNumber: 1
    };

    this.filterChange.emit(filterParams);

    const currentUrl = this.router.url;
    const isLandingPage = currentUrl === '/' || currentUrl.startsWith('/?') || !currentUrl.includes('/properties');

    if (isLandingPage || forceNavigateToProperties) {
      this.router.navigate(['/properties'], { queryParams });
    } else {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams,
        queryParamsHandling: 'merge'
      });
    }
  }
}
