import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PropertyService } from '../../../core/services/property.service';
import { Property, PropertyFilterParams } from '../../../core/models/property.model';
import { PropertyCardComponent } from '../property-card/property-card.component';
import { SearchFilterPanelComponent } from '../search-filter-panel/search-filter-panel.component';
import { InquiryModalComponent } from '../../inquiries/inquiry-modal.component';
import { PropertyMapComponent } from '../property-map/property-map.component';

@Component({
  selector: 'app-property-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PropertyCardComponent,
    SearchFilterPanelComponent,
    InquiryModalComponent,
    PropertyMapComponent
  ],
  templateUrl: './property-list.component.html',
  styleUrls: []
})
export class PropertyListComponent implements OnInit, OnDestroy {
  private readonly propertyService = inject(PropertyService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private queryParamsSub?: Subscription;

  // View Mode for small screens: 'grid' vs 'map'
  readonly viewMode = signal<'grid' | 'map'>('grid');

  // Search input state
  readonly searchTermInput = signal<string>('');
  readonly currentSortBy = signal<string>('date_desc');

  // Filter drawer modal state
  readonly isFilterDrawerOpen = signal<boolean>(false);

  // Data & Async State Signals
  properties = signal<Property[]>([]);
  totalCount = signal<number>(0);
  totalPages = signal<number>(1);
  pageNumber = signal<number>(1);
  pageSize = signal<number>(8);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  // Inquiry Modal State Signals
  selectedInquiryProperty = signal<Property | null>(null);
  isInquiryModalOpen = signal<boolean>(false);

  // Helper computed for pagination buttons
  pagesArray = computed(() => {
    const total = this.totalPages();
    const pages: number[] = [];
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
    return pages;
  });

  toggleViewMode(mode: 'grid' | 'map'): void {
    this.viewMode.set(mode);
  }

  toggleFilterDrawer(): void {
    this.isFilterDrawerOpen.update(v => !v);
  }

  ngOnInit(): void {
    this.queryParamsSub = this.route.queryParams.subscribe(params => {
      const currentPage = params['pageNumber'] ? Number(params['pageNumber']) : 1;
      this.pageNumber.set(currentPage);

      const searchVal = params['searchTerm'] || '';
      this.searchTermInput.set(searchVal);

      const sortVal = params['sortBy'] || 'date_desc';
      this.currentSortBy.set(sortVal);

      const filterParams: PropertyFilterParams = {
        searchTerm: searchVal || undefined,
        purpose: params['purpose'] || undefined,
        city: params['city'] || undefined,
        cityArea: params['cityArea'] || undefined,
        category: params['category'] || undefined,
        minPrice: params['minPrice'] != null && params['minPrice'] !== '' ? Number(params['minPrice']) : undefined,
        maxPrice: params['maxPrice'] != null && params['maxPrice'] !== '' ? Number(params['maxPrice']) : undefined,
        minArea: params['minArea'] != null && params['minArea'] !== '' ? Number(params['minArea']) : undefined,
        maxArea: params['maxArea'] != null && params['maxArea'] !== '' ? Number(params['maxArea']) : undefined,
        bedrooms: params['bedrooms'] != null && params['bedrooms'] !== '' ? Number(params['bedrooms']) : undefined,
        bathrooms: params['bathrooms'] != null && params['bathrooms'] !== '' ? Number(params['bathrooms']) : undefined,
        sortBy: sortVal,
        pageNumber: currentPage,
        pageSize: this.pageSize()
      };

      this.loadProperties(filterParams);
    });
  }

  ngOnDestroy(): void {
    this.queryParamsSub?.unsubscribe();
  }

  loadProperties(params: PropertyFilterParams): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.propertyService.getProperties(params).subscribe({
      next: (result) => {
        this.properties.set(result.items);
        this.totalCount.set(result.totalCount);
        this.totalPages.set(result.totalPages);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading properties:', err);
        this.errorMessage.set('تعذر تحميل العقارات. يرجى المحاولة مرة أخرى.');
        this.isLoading.set(false);
      }
    });
  }

  onSearchSubmit(): void {
    const val = this.searchTermInput().trim();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        searchTerm: val || null,
        pageNumber: 1
      },
      queryParamsHandling: 'merge'
    });
  }

  onSortChange(sortBy: string): void {
    this.currentSortBy.set(sortBy);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        sortBy: sortBy,
        pageNumber: 1
      },
      queryParamsHandling: 'merge'
    });
  }

  handleQuickFilter(event: { key: string; value: any }): void {
    const queryUpdate: Record<string, any> = { pageNumber: 1 };
    if (event.key === 'priceRange') {
      queryUpdate['minPrice'] = event.value.min;
      queryUpdate['maxPrice'] = event.value.max;
    } else {
      queryUpdate[event.key] = event.value;
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryUpdate,
      queryParamsHandling: 'merge'
    });
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages() && page !== this.pageNumber()) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { pageNumber: page },
        queryParamsHandling: 'merge'
      });
    }
  }

  onMapPropertySelected(prop: Property): void {
    // Optionally handle marker click selection
  }

  openInquiryModal(property: Property): void {
    this.selectedInquiryProperty.set(property);
    this.isInquiryModalOpen.set(true);
  }

  closeInquiryModal(): void {
    this.isInquiryModalOpen.set(false);
    this.selectedInquiryProperty.set(null);
  }
}
