import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FavoriteService } from '../../core/services/favorite.service';
import { InquiryModalComponent } from '../inquiries/inquiry-modal.component';
import { Property } from '../../core/models/property.model';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RouterLink, InquiryModalComponent],
  templateUrl: './favorites.component.html',
  styleUrls: []
})
export class FavoritesComponent implements OnInit {
  readonly favoriteService = inject(FavoriteService);

  readonly selectedInquiryProperty = signal<Property | null>(null);
  readonly isInquiryModalOpen = signal<boolean>(false);

  ngOnInit(): void {
    this.favoriteService.loadFavorites().subscribe();
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
