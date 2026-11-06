import { Component, input, output, inject, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Property, CreatePropertyRequest, UpdatePropertyRequest } from '../../core/models/property.model';
import { PropertyService } from '../../core/services/property.service';
import { ImageManagerComponent } from './image-manager/image-manager.component';

@Component({
  selector: 'app-property-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ImageManagerComponent],
  templateUrl: './property-form-modal.component.html',
  styleUrls: []
})
export class PropertyFormModalComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly propertyService = inject(PropertyService);

  readonly isOpen = input<boolean>(false);
  readonly property = input<Property | null>(null);

  readonly close = output<void>();
  readonly saved = output<Property>();

  readonly submitting = signal<boolean>(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly propertyImages = signal<string[]>([]);

  readonly categories = [
    { label: 'شقة سكنية', value: 'Apartment' },
    { label: 'فيلا مستقلة', value: 'Villa' },
    { label: 'عقار تجاري', value: 'Commercial' },
    { label: 'أرض استثمارية', value: 'Land' }
  ];

  readonly cityAreas = [
    'الشهباء',
    'العزيزية',
    'الفرقان',
    'السبيل',
    'السريان',
    'حلب الجديدة',
    'المحافظة',
    'أدونيس',
    'شارع النيل'
  ];

  readonly statuses = [
    { label: 'متاح للبيع/الإيجار', value: 'Available' },
    { label: 'تم البيع', value: 'Sold' },
    { label: 'تم التأجير', value: 'Rented' }
  ];

  readonly defaultImage = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&auto=format&fit=crop';

  propertyForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(5)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    price: [null, [Validators.required, Validators.min(0)]],
    category: ['Apartment', [Validators.required]],
    cityArea: ['الشهباء', [Validators.required]],
    address: ['', [Validators.required]],
    bedrooms: [2, [Validators.required, Validators.min(0)]],
    bathrooms: [1, [Validators.required, Validators.min(0)]],
    areaSquareMeters: [100, [Validators.required, Validators.min(1)]],
    imageUrl: ['', []],
    status: ['Available', [Validators.required]]
  });

  get isEditMode(): boolean {
    return !!this.property();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['property'] || changes['isOpen']) {
      if (this.isOpen()) {
        this.populateForm();
      }
    }
  }

  onImagesChange(urls: string[]): void {
    this.propertyImages.set(urls);
  }

  private populateForm(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.submitting.set(false);

    const p = this.property();
    if (p) {
      this.propertyImages.set(p.imageUrls && p.imageUrls.length > 0 ? [...p.imageUrls] : []);
      this.propertyForm.patchValue({
        title: p.title || '',
        description: p.description || '',
        price: p.price ?? null,
        category: p.category || 'Apartment',
        cityArea: p.cityArea || 'الشهباء',
        address: p.address || '',
        bedrooms: p.bedrooms ?? 0,
        bathrooms: p.bathrooms ?? 0,
        areaSquareMeters: p.areaSquareMeters ?? 1,
        imageUrl: (p.imageUrls && p.imageUrls.length > 0) ? p.imageUrls[0] : '',
        status: p.status || 'Available'
      });
    } else {
      this.propertyImages.set([]);
      this.propertyForm.reset({
        category: 'Apartment',
        cityArea: 'الشهباء',
        bedrooms: 2,
        bathrooms: 1,
        areaSquareMeters: 100,
        status: 'Available',
        imageUrl: ''
      });
    }
  }

  onClose(): void {
    if (this.submitting()) return;
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.close.emit();
  }

  onSubmit(): void {
    if (this.propertyForm.invalid) {
      this.propertyForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const val = this.propertyForm.value;
    let imageUrls = [...this.propertyImages()];
    if (val.imageUrl && val.imageUrl.trim()) {
      const trimmed = val.imageUrl.trim();
      if (!imageUrls.includes(trimmed)) {
        imageUrls.unshift(trimmed);
      }
    }
    if (imageUrls.length === 0) {
      imageUrls = [this.defaultImage];
    }

    const currentProp = this.property();

    if (currentProp) {
      // Update Mode
      const updateDto: UpdatePropertyRequest = {
        title: val.title.trim(),
        description: val.description.trim(),
        price: Number(val.price),
        category: val.category,
        cityArea: val.cityArea,
        address: val.address.trim(),
        bedrooms: Number(val.bedrooms),
        bathrooms: Number(val.bathrooms),
        areaSquareMeters: Number(val.areaSquareMeters),
        imageUrls: imageUrls,
        status: val.status
      };

      this.propertyService.updateProperty(currentProp.id, updateDto).subscribe({
        next: (updated) => {
          this.submitting.set(false);
          this.successMessage.set('تم تحديث بيانات العقار بنجاح!');
          this.saved.emit(updated);
          setTimeout(() => {
            this.onClose();
          }, 1200);
        },
        error: (err) => {
          this.submitting.set(false);
          this.errorMessage.set(err?.error?.error || 'حدث خطأ أثناء تحديث البيانات. يرجى المحاولة لاحقاً.');
        }
      });
    } else {
      // Create Mode
      const createDto: CreatePropertyRequest = {
        title: val.title.trim(),
        description: val.description.trim(),
        price: Number(val.price),
        category: val.category,
        cityArea: val.cityArea,
        address: val.address.trim(),
        bedrooms: Number(val.bedrooms),
        bathrooms: Number(val.bathrooms),
        areaSquareMeters: Number(val.areaSquareMeters),
        imageUrls: imageUrls
      };

      this.propertyService.createProperty(createDto).subscribe({
        next: (created) => {
          this.submitting.set(false);
          this.successMessage.set('تمت إضافة العقار الجديد بنجاح!');
          this.saved.emit(created);
          setTimeout(() => {
            this.onClose();
          }, 1200);
        },
        error: (err) => {
          this.submitting.set(false);
          this.errorMessage.set(err?.error?.error || 'حدث خطأ أثناء إضافة العقار. يرجى المحاولة لاحقاً.');
        }
      });
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.propertyForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
}
