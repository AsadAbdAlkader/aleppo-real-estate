import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PropertyService } from '../../core/services/property.service';
import { FavoriteService } from '../../core/services/favorite.service';
import { AuthService } from '../../core/services/auth.service';
import { CurrencyService } from '../../core/services/currency.service';
import { ComparisonService } from '../../core/services/comparison.service';
import { Property } from '../../core/models/property.model';
import { InquiryModalComponent } from '../inquiries/inquiry-modal.component';
import { MortgageCalculatorComponent } from './mortgage-calculator/mortgage-calculator.component';

export interface NeighborhoodInfo {
  vibe: string;
  rating: number;
  amenities: { icon: string; name: string; dist: string }[];
}

@Component({
  selector: 'app-property-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, InquiryModalComponent, MortgageCalculatorComponent],
  templateUrl: './property-detail.component.html',
  styleUrls: []
})
export class PropertyDetailComponent implements OnInit {
  private readonly propertyService = inject(PropertyService);
  readonly favoriteService = inject(FavoriteService);
  readonly authService = inject(AuthService);
  readonly currencyService = inject(CurrencyService);
  readonly comparisonService = inject(ComparisonService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly destroyRef = inject(DestroyRef);

  // State Signals
  readonly property = signal<Property | null>(null);
  readonly loading = signal<boolean>(true);
  readonly notFound = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly selectedImageIndex = signal<number>(0);
  readonly imageError = signal<boolean>(false);
  readonly copiedToast = signal<boolean>(false);
  readonly compareToast = signal<string | null>(null);
  readonly isInquiryModalOpen = signal<boolean>(false);
  readonly isMortgageModalOpen = signal<boolean>(false);
  readonly isTogglingFavorite = signal<boolean>(false);

  readonly defaultImage = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&auto=format&fit=crop';

  // Computeds
  readonly imageUrls = computed<string[]>(() => {
    const p = this.property();
    if (p && p.imageUrls && p.imageUrls.length > 0) {
      return p.imageUrls;
    }
    return [this.defaultImage];
  });

  readonly currentImageUrl = computed<string>(() => {
    if (this.imageError()) {
      return this.defaultImage;
    }
    const urls = this.imageUrls();
    const index = this.selectedImageIndex();
    return urls[index] || urls[0] || this.defaultImage;
  });

  readonly isFavorite = computed<boolean>(() => {
    const p = this.property();
    return p ? this.favoriteService.isFavorite(p.id) : false;
  });

  readonly isCompared = computed<boolean>(() => {
    const p = this.property();
    return p ? this.comparisonService.isInComparison(p.id) : false;
  });

  readonly formattedPrice = computed<string>(() => {
    const p = this.property();
    return p ? this.currencyService.formatPrice(p.price) : '$0';
  });

  readonly pricePerM2 = computed<string>(() => {
    const p = this.property();
    if (!p || !p.areaSquareMeters || p.areaSquareMeters <= 0) return '—';
    return this.currencyService.formatPrice(Math.round(p.price / p.areaSquareMeters));
  });

  readonly ownerName = computed<string>(() => {
    return this.property()?.ownerName || 'وكيل عقارات الشهباء المعتمد';
  });

  readonly neighborhoodGuide = computed<NeighborhoodInfo>(() => {
    const area = this.property()?.cityArea || '';
    return this.getNeighborhoodData(area);
  });

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const id = params.get('id');
        if (id) {
          this.loadProperty(id);
        } else {
          this.loading.set(false);
          this.notFound.set(true);
        }
      });
  }

  loadProperty(id: string): void {
    this.loading.set(true);
    this.notFound.set(false);
    this.errorMessage.set(null);
    this.selectedImageIndex.set(0);
    this.imageError.set(false);

    this.propertyService.getPropertyById(id).subscribe({
      next: (data) => {
        if (!data) {
          this.notFound.set(true);
        } else {
          this.property.set(data);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        if (err?.status === 404) {
          this.notFound.set(true);
        } else {
          this.errorMessage.set('عذراً، لم نتمكن من جلب تفاصيل العقار المطلوبة.');
        }
      }
    });
  }

  selectImage(index: number): void {
    this.imageError.set(false);
    this.selectedImageIndex.set(index);
  }

  onImageError(): void {
    if (!this.imageError()) {
      this.imageError.set(true);
    }
  }

  onToggleFavorite(): void {
    const p = this.property();
    if (!p) return;

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    if (this.isTogglingFavorite()) return;

    this.isTogglingFavorite.set(true);
    this.favoriteService.toggleFavorite(p).subscribe({
      next: () => this.isTogglingFavorite.set(false),
      error: () => this.isTogglingFavorite.set(false)
    });
  }

  onToggleCompare(): void {
    const p = this.property();
    if (!p) return;

    const res = this.comparisonService.toggleProperty(p);
    if (res.message) {
      this.compareToast.set(res.message);
      setTimeout(() => this.compareToast.set(null), 3000);
    }
  }

  openMortgageCalculator(): void {
    this.isMortgageModalOpen.set(true);
  }

  closeMortgageCalculator(): void {
    this.isMortgageModalOpen.set(false);
  }

  printBrochure(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  onOpenInquiryModal(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    this.isInquiryModalOpen.set(true);
  }

  onDirectContact(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    const prop = this.property();
    const ownerId = prop?.ownerId || '3fa85f64-5717-4562-b3fc-2c963f66b222';
    const propertyId = prop?.id;
    this.router.navigate(['/messages'], { queryParams: { userId: ownerId, propertyId: propertyId } });
  }

  onCloseInquiryModal(): void {
    this.isInquiryModalOpen.set(false);
  }

  shareLink(): void {
    if (typeof window !== 'undefined' && navigator?.clipboard) {
      navigator.clipboard.writeText(window.location.href).then(() => {
        this.copiedToast.set(true);
        setTimeout(() => this.copiedToast.set(false), 3000);
      }).catch(() => {
        this.fallbackCopyLink();
      });
    } else {
      this.fallbackCopyLink();
    }
  }

  private fallbackCopyLink(): void {
    this.copiedToast.set(true);
    setTimeout(() => this.copiedToast.set(false), 3000);
  }

  goBack(): void {
    this.location.back();
  }

  getCategoryLabel(category?: string): string {
    switch (category) {
      case 'Apartment': return 'شقة سكنية';
      case 'Villa': return 'فيلا مستقلة';
      case 'Commercial': return 'عقار تجاري';
      case 'Land': return 'أرض استثمارية';
      default: return category || 'عقار';
    }
  }

  getCategoryIcon(category?: string): string {
    switch (category) {
      case 'Apartment': return '🏢';
      case 'Villa': return '🏰';
      case 'Commercial': return '💼';
      case 'Land': return '🏞️';
      default: return '🏡';
    }
  }

  getPurposeLabel(purpose?: string): string {
    switch (purpose?.toLowerCase()) {
      case 'sale': return 'للبيع';
      case 'rent': return 'للإيجار';
      default: return purpose || 'للبيع';
    }
  }

  getStatusBadgeClass(status?: string): string {
    switch (status) {
      case 'Available': return 'bg-emerald-500 text-white';
      case 'Sold': return 'bg-rose-600 text-white';
      case 'Rented': return 'bg-amber-600 text-white';
      default: return 'bg-slate-700 text-white';
    }
  }

  getStatusLabel(status?: string): string {
    switch (status) {
      case 'Available': return 'متاح';
      case 'Sold': return 'مباع';
      case 'Rented': return 'مؤجر';
      default: return status || 'متاح';
    }
  }

  private getNeighborhoodData(cityArea: string): NeighborhoodInfo {
    if (cityArea.includes('الشهباء')) {
      return {
        vibe: 'أرقى الأحياء السكنية الهادئة في مدينة حلب، يمتاز بالفيلات والشقق الفارهة والحدائق القريبة من شارع النيل.',
        rating: 4.9,
        amenities: [
          { icon: '🏫', name: 'جامعة حلب والمدارس النموذجية المتميزة', dist: '5 دقائق' },
          { icon: '🏥', name: 'مشفى الشهباء ومجمع العيادات التخصصية', dist: '3 دقائق' },
          { icon: '🌳', name: 'الحديقة العامة والمساحات الخضراء العائلية', dist: 'مشي على الأقدام' },
          { icon: '☕', name: 'أرقى المطاعم والمقاهي ومراكز التسوق', dist: 'دقيقتان' }
        ]
      };
    }
    if (cityArea.includes('الفرقان')) {
      return {
        vibe: 'حي حيوي متكامل الخدمات بجوار الحرم الجامعي، نشاط اقتصادي واجتماعي راقٍ يلبي كافة احتياجات الأسرة.',
        rating: 4.8,
        amenities: [
          { icon: '🎓', name: 'جامعة حلب والكليات والمعاهد المركزية', dist: '3 دقائق' },
          { icon: '🛍️', name: 'أسواق شارع أدونيس والمراكز التجارية', dist: 'مشي على الأقدام' },
          { icon: '🏥', name: 'المشافي الجامعية والصيدليات المركزية', dist: '4 دقائق' },
          { icon: '🚌', name: 'عقدة مواصلات مباشرة لكافة مناطق حلب', dist: 'دقيقة واحدة' }
        ]
      };
    }
    if (cityArea.includes('العزيزية')) {
      return {
        vibe: 'القلب التجاري والتاريخي النابض لحلب، طابع معماري تراثي رفيع، ومقر للشركات الكبرى والاستشارات.',
        rating: 4.7,
        amenities: [
          { icon: '🏛️', name: 'شارع القوتلي والمقرات المصرفية والمالية', dist: 'مشي على الأقدام' },
          { icon: '⛪', name: 'المعالم الأثرية والمطاعم التراثية الفاخرة', dist: 'دقيقتان' },
          { icon: '💼', name: 'المكاتب الهندسية وشركات المقاولات', dist: 'مشي' },
          { icon: '🏥', name: 'مراكز طبية تخصصية ومختبرات', dist: '3 دقائق' }
        ]
      };
    }
    if (cityArea.includes('السبيل')) {
      return {
        vibe: 'حي عائلي هادئ ذو شوارع مشجرة فسيحة، معروف بمتنزه دوار السبيل وتوفر كافة الخدمات الأساسية والترفيهية.',
        rating: 4.8,
        amenities: [
          { icon: '🌳', name: 'حديقة السبيل الكبرى والمسارات الرياضية', dist: 'مشي على الأقدام' },
          { icon: '🏫', name: 'مدارس وثانويات خاصة وحكومية نموذجية', dist: '4 دقائق' },
          { icon: '☕', name: 'كافيهات ومطاعم عائلية هادئة', dist: '3 دقائق' },
          { icon: '🛒', name: 'متاجر السوبرماركت والخدمات اليومية', dist: 'دقيقتان' }
        ]
      };
    }
    if (cityArea.includes('حلب الجديدة')) {
      return {
        vibe: 'التوسع العمراني الحديث لحلب، أبنية فخمة بتصاميم هندسية عصرية وشوارع عريضة ومواقف سيارات متسعة.',
        rating: 4.7,
        amenities: [
          { icon: '🏙️', name: 'المجمعات السكنية والتجارية الحديثة', dist: '3 دقائق' },
          { icon: '🚗', name: 'مداخل مباشرة على المحاور السريعة', dist: 'دقيقتان' },
          { icon: '🏫', name: 'مدارس خاصة ومؤسسات تعليمية حديثة', dist: '5 دقائق' },
          { icon: '🌳', name: 'ساحات وحدائق ترفيهية للأطفال', dist: 'مشي' }
        ]
      };
    }
    return {
      vibe: 'موقع مميز في مدينة حلب، يتمتع بقربه من المرافق العامة وسهولة الوصول لمختلف أحياء المدينة.',
      rating: 4.6,
      amenities: [
        { icon: '🏫', name: 'مدارس ومؤسسات تعليمية قريبة', dist: '5 دقائق' },
        { icon: '🏥', name: 'مراكز صحية وصيدليات مناوبة', dist: '3 دقائق' },
        { icon: '🛒', name: 'مراكز تجارية وأسواق تموينية', dist: 'مشي' },
        { icon: '🚗', name: 'مواصلات عامة وسيارات أجرة متوفرة', dist: 'دقيقة' }
      ]
    };
  }
}
