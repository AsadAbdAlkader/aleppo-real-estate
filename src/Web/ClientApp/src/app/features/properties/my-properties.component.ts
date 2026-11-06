import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PropertyService } from '../../core/services/property.service';
import { Property } from '../../core/models/property.model';
import { PropertyFormModalComponent } from './property-form-modal.component';
import { DeleteConfirmModalComponent } from './delete-confirm-modal.component';

@Component({
  selector: 'app-my-properties',
  standalone: true,
  imports: [
    CommonModule,
    DecimalPipe,
    PropertyFormModalComponent,
    DeleteConfirmModalComponent
  ],
  templateUrl: './my-properties.component.html',
  styleUrls: []
})
export class MyPropertiesComponent implements OnInit {
  private readonly propertyService = inject(PropertyService);
  private readonly route = inject(ActivatedRoute);

  readonly properties = signal<Property[]>([]);
  readonly loading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);

  // Form Modal state
  readonly isFormModalOpen = signal<boolean>(false);
  readonly selectedPropertyForEdit = signal<Property | null>(null);

  // Delete Modal state
  readonly isDeleteModalOpen = signal<boolean>(false);
  readonly selectedPropertyForDelete = signal<Property | null>(null);

  readonly defaultImage = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&auto=format&fit=crop';

  ngOnInit(): void {
    this.loadMyProperties();

    // Check if query param specifies opening create modal
    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'new') {
        this.openCreateModal();
      }
    });
  }

  loadMyProperties(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.propertyService.getMyProperties().subscribe({
      next: (data) => {
        this.properties.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.error || 'حدث خطأ أثناء تحميل العقارات الخاصة بك.');
        this.loading.set(false);
      }
    });
  }

  openCreateModal(): void {
    this.selectedPropertyForEdit.set(null);
    this.isFormModalOpen.set(true);
  }

  openEditModal(property: Property): void {
    this.selectedPropertyForEdit.set(property);
    this.isFormModalOpen.set(true);
  }

  closeFormModal(): void {
    this.isFormModalOpen.set(false);
    this.selectedPropertyForEdit.set(null);
  }

  onPropertySaved(savedProperty: Property): void {
    this.loadMyProperties();
  }

  openDeleteModal(property: Property): void {
    this.selectedPropertyForDelete.set(property);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.selectedPropertyForDelete.set(null);
  }

  onDeleteConfirmed(propertyId: string): void {
    this.propertyService.deleteProperty(propertyId).subscribe({
      next: () => {
        // Remove locally
        this.properties.update(list => list.filter(p => p.id !== propertyId));
        this.closeDeleteModal();
      },
      error: (err) => {
        alert(err?.error?.error || 'حدث خطأ أثناء حذف العقار.');
        this.closeDeleteModal();
      }
    });
  }

  getCategoryLabel(category: string): string {
    switch (category) {
      case 'Apartment': return 'شقة';
      case 'Villa': return 'فيلا';
      case 'Commercial': return 'تجاري';
      case 'Land': return 'أرض';
      default: return category;
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Available': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Sold': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Rented': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'Available': return 'متاح';
      case 'Sold': return 'تم البيع';
      case 'Rented': return 'تم التأجير';
      default: return status || 'متاح';
    }
  }
}
