import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PropertyService } from '../../core/services/property.service';
import { Property } from '../../core/models/property.model';
import { SearchFilterPanelComponent } from '../properties/search-filter-panel/search-filter-panel.component';
import { PropertyCardComponent } from '../properties/property-card/property-card.component';
import { InquiryModalComponent } from '../inquiries/inquiry-modal.component';

export interface Neighborhood {
  id: string;
  name: string;
  propertyCount: number;
  description: string;
  imageUrl: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    SearchFilterPanelComponent,
    PropertyCardComponent,
    InquiryModalComponent
  ],
  templateUrl: './landing.component.html',
  styleUrls: []
})
export class LandingComponent implements OnInit {
  private readonly propertyService = inject(PropertyService);

  // Featured Aleppo neighborhoods
  readonly neighborhoods = signal<Neighborhood[]>([
    {
      id: 'al-shahbaa',
      name: 'الشهباء',
      propertyCount: 142,
      description: 'من أرقى الأحياء السكنية في حلب تتميز بالهدوء والمباني الحديثة',
      imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop'
    },
    {
      id: 'al-aziziyeh',
      name: 'العزيزية',
      propertyCount: 98,
      description: 'مركز حلب التاريخي والتجاري العريق المفعم بالحيوية',
      imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop'
    },
    {
      id: 'al-furqan',
      name: 'الفرقان',
      propertyCount: 115,
      description: 'حي حيوي وقريب من جامعة حلب ومراكز الخدمات',
      imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&auto=format&fit=crop'
    },
    {
      id: 'al-sabeel',
      name: 'السبيل',
      propertyCount: 86,
      description: 'منطقة سكنية هادئة تتميز بالحدائق والمساحات الخضراء',
      imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&auto=format&fit=crop'
    },
    {
      id: 'al-sirian',
      name: 'السريان',
      propertyCount: 74,
      description: 'حي عريق يضم أسواقاً ومراكز تجارية ومساكن متميزة',
      imageUrl: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=600&auto=format&fit=crop'
    }
  ]);

  // Properties state signals
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

  ngOnInit(): void {
    this.loadProperties();
  }

  loadProperties(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.propertyService.getProperties({ pageNumber: this.pageNumber(), pageSize: this.pageSize() }).subscribe({
      next: (result) => {
        this.properties.set(result.items);
        this.totalCount.set(result.totalCount);
        this.totalPages.set(result.totalPages);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading properties on landing page:', err);
        this.errorMessage.set('تعذر تحميل العقارات.');
        this.isLoading.set(false);
      }
    });
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages() && page !== this.pageNumber()) {
      this.pageNumber.set(page);
      this.loadProperties();
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
