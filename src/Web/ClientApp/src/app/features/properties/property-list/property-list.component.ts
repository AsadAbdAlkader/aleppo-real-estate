import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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

  // View Mode: 'grid' vs 'map'
  readonly viewMode = signal<'grid' | 'map'>('grid');

  // Data & Async State Signals
  properties = signal<Property[]>([]);
  totalCount = signal<number>(0);
  totalPages = signal<number>(1);
  pageNumber = signal<number>(1);
  pageSize = signal<number>(6);
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

  ngOnInit(): void {
    // Listen to query parameter changes to update state & reload properties
    this.queryParamsSub = this.route.queryParams.subscribe(params => {
      const currentPage = params['pageNumber'] ? Number(params['pageNumber']) : 1;
      this.pageNumber.set(currentPage);

      const filterParams: PropertyFilterParams = {
        searchTerm: params['searchTerm'] || undefined,
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
        sortBy: params['sortBy'] || 'date_desc',
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

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages() && page !== this.pageNumber()) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { pageNumber: page },
        queryParamsHandling: 'merge'
      });
    }
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
