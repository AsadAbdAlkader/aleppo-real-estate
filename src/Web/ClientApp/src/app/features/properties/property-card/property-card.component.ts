import { Component, input, output, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Property } from '../../../core/models/property.model';
import { FavoriteService } from '../../../core/services/favorite.service';
import { AuthService } from '../../../core/services/auth.service';
import { CurrencyService } from '../../../core/services/currency.service';
import { ComparisonService } from '../../../core/services/comparison.service';

@Component({
  selector: 'app-property-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './property-card.component.html',
  styleUrls: []
})
export class PropertyCardComponent {
  readonly favoriteService = inject(FavoriteService);
  readonly authService = inject(AuthService);
  readonly currencyService = inject(CurrencyService);
  readonly comparisonService = inject(ComparisonService);
  private readonly router = inject(Router);

  readonly property = input.required<Property>();
  readonly openInquiry = output<Property>();

  imageError = signal(false);
  isTogglingFavorite = signal(false);
  readonly toastMessage = signal<string | null>(null);

  readonly defaultImage = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&auto=format&fit=crop';

  onImageError() {
    this.imageError.set(true);
  }

  get mainImageUrl(): string {
    const p = this.property();
    if (this.imageError() || !p.imageUrls || p.imageUrls.length === 0) {
      return this.defaultImage;
    }
    return p.imageUrls[0];
  }

  get isFavorite(): boolean {
    return this.favoriteService.isFavorite(this.property().id);
  }

  get isCompared(): boolean {
    return this.comparisonService.isInComparison(this.property().id);
  }

  get formattedPrice(): string {
    return this.currencyService.formatPrice(this.property().price);
  }

  onToggleFavorite(event: Event): void {
    event.stopPropagation();

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.isTogglingFavorite()) return;

    this.isTogglingFavorite.set(true);
    this.favoriteService.toggleFavorite(this.property()).subscribe({
      next: () => this.isTogglingFavorite.set(false),
      error: () => this.isTogglingFavorite.set(false)
    });
  }

  onToggleCompare(event: Event): void {
    event.stopPropagation();
    const result = this.comparisonService.toggleProperty(this.property());
    if (result.message) {
      this.toastMessage.set(result.message);
      setTimeout(() => this.toastMessage.set(null), 2500);
    }
  }

  onInquiryClick(event: Event): void {
    event.stopPropagation();
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    this.openInquiry.emit(this.property());
  }
}
