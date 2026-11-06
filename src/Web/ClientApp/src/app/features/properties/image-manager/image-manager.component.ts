import { Component, input, output, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PropertyService } from '../../../core/services/property.service';

@Component({
  selector: 'app-image-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './image-manager.component.html',
  styleUrls: []
})
export class ImageManagerComponent {
  private readonly propertyService = inject(PropertyService);

  readonly propertyId = input<string | null>(null);
  readonly images = input<string[]>([]);
  readonly disabled = input<boolean>(false);

  readonly imagesChange = output<string[]>();
  readonly uploadError = output<string>();

  readonly imageUrls = signal<string[]>([]);
  readonly uploading = signal<boolean>(false);
  readonly isDragging = signal<boolean>(false);
  readonly validationError = signal<string | null>(null);
  readonly urlInput = signal<string>('');

  readonly MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
  readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  readonly ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

  constructor() {
    effect(() => {
      const incoming = this.images() || [];
      this.imageUrls.set([...incoming]);
    });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.disabled()) {
      this.isDragging.set(true);
    }
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    if (this.disabled()) return;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFiles(Array.from(files));
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFiles(Array.from(input.files));
      input.value = ''; // Reset file input
    }
  }

  private handleFiles(files: File[]): void {
    this.validationError.set(null);

    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    for (const file of files) {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      const isTypeValid = this.ALLOWED_TYPES.includes(file.type.toLowerCase()) || this.ALLOWED_EXTENSIONS.includes(ext);
      const isSizeValid = file.size <= this.MAX_FILE_SIZE_BYTES;

      if (!isTypeValid) {
        invalidFiles.push(`"${file.name}" (نوع الملف غير مدعوم، يرجى استخدام JPG, PNG, WEBP)`);
      } else if (!isSizeValid) {
        invalidFiles.push(`"${file.name}" (تتجاوز الحد المسموح 5 ميجابايت)`);
      } else {
        validFiles.push(file);
      }
    }

    if (invalidFiles.length > 0) {
      const errorMsg = `تعذر إضافة بعض الملفات:\n${invalidFiles.join('\n')}`;
      this.validationError.set(errorMsg);
      this.uploadError.emit(errorMsg);
    }

    if (validFiles.length === 0) {
      return;
    }

    const propId = this.propertyId();

    if (propId) {
      // Backend Upload Mode
      this.uploading.set(true);
      this.propertyService.uploadImages(propId, validFiles).subscribe({
        next: (res) => {
          this.uploading.set(false);
          this.imageUrls.set(res.imageUrls);
          this.imagesChange.emit(res.imageUrls);
        },
        error: (err) => {
          this.uploading.set(false);
          const errorMsg = err?.error?.error || 'حدث خطأ أثناء رفع الصور إلى السيرفر.';
          this.validationError.set(errorMsg);
          this.uploadError.emit(errorMsg);
        }
      });
    } else {
      // Local Client Preview Mode
      const newUrls = validFiles.map(file =>
        typeof URL !== 'undefined'
          ? URL.createObjectURL(file)
          : ''
      ).filter(url => !!url);

      const updated = [...this.imageUrls(), ...newUrls];
      this.imageUrls.set(updated);
      this.imagesChange.emit(updated);
    }
  }

  addUrlImage(): void {
    const url = this.urlInput().trim();
    if (!url) return;

    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:') && !url.startsWith('/')) {
      this.validationError.set('يرجى أدخال رابط صورة صحيح (يبدأ بـ http:// أو https://).');
      return;
    }

    this.validationError.set(null);
    const updated = [...this.imageUrls(), url];
    this.imageUrls.set(updated);
    this.imagesChange.emit(updated);
    this.urlInput.set('');
  }

  setPrimary(imageUrl: string): void {
    if (this.disabled()) return;
    const propId = this.propertyId();

    if (propId) {
      this.uploading.set(true);
      this.propertyService.setPrimaryImage(propId, imageUrl).subscribe({
        next: (res) => {
          this.uploading.set(false);
          this.imageUrls.set(res.imageUrls);
          this.imagesChange.emit(res.imageUrls);
        },
        error: (err) => {
          this.uploading.set(false);
          const errorMsg = err?.error?.error || 'حدث خطأ أثناء تعيين الصورة الرئيسية.';
          this.validationError.set(errorMsg);
        }
      });
    } else {
      const current = this.imageUrls();
      const filtered = current.filter(u => u !== imageUrl);
      const updated = [imageUrl, ...filtered];
      this.imageUrls.set(updated);
      this.imagesChange.emit(updated);
    }
  }

  deleteImage(imageUrl: string): void {
    if (this.disabled()) return;
    const propId = this.propertyId();

    if (propId) {
      this.uploading.set(true);
      this.propertyService.deleteImage(propId, imageUrl).subscribe({
        next: (res) => {
          this.uploading.set(false);
          this.imageUrls.set(res.imageUrls);
          this.imagesChange.emit(res.imageUrls);
        },
        error: (err) => {
          this.uploading.set(false);
          const errorMsg = err?.error?.error || 'حدث خطأ أثناء حذف الصورة.';
          this.validationError.set(errorMsg);
        }
      });
    } else {
      const updated = this.imageUrls().filter(u => u !== imageUrl);
      this.imageUrls.set(updated);
      this.imagesChange.emit(updated);
    }
  }

  clearError(): void {
    this.validationError.set(null);
  }
}
