import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ComparisonService } from '../../../core/services/comparison.service';
import { CurrencyService } from '../../../core/services/currency.service';
import { Property } from '../../../core/models/property.model';

@Component({
  selector: 'app-property-comparison',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './property-comparison.component.html',
  styleUrls: []
})
export class PropertyComparisonComponent {
  readonly comparisonService = inject(ComparisonService);
  readonly currencyService = inject(CurrencyService);

  getPricePerSquareMeter(p: Property): string {
    if (!p.areaSquareMeters || p.areaSquareMeters <= 0) return '—';
    const pricePerM2 = p.price / p.areaSquareMeters;
    return this.currencyService.formatPrice(Math.round(pricePerM2));
  }

  formatPrice(price: number): string {
    return this.currencyService.formatPrice(price);
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

  getPurposeLabel(purpose?: string): string {
    switch (purpose?.toLowerCase()) {
      case 'sale': return 'للبيع';
      case 'rent': return 'للإيجار';
      default: return purpose || 'للبيع';
    }
  }

  getStatusBadge(status?: string): { label: string; css: string } {
    switch (status) {
      case 'Available': return { label: 'متاح', css: 'bg-emerald-100 text-emerald-800' };
      case 'Sold': return { label: 'مباع', css: 'bg-rose-100 text-rose-800' };
      case 'Rented': return { label: 'مؤجر', css: 'bg-slate-200 text-slate-800' };
      default: return { label: status || 'متاح', css: 'bg-slate-100 text-slate-700' };
    }
  }
}
