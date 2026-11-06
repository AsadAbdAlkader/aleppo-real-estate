import { Component, input, output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Property } from '../../core/models/property.model';
import { InquiryService } from '../../core/services/inquiry.service';
import { AuthService } from '../../core/services/auth.service';
import { InquiryDto } from '../../core/models/inquiry.model';

@Component({
  selector: 'app-inquiry-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './inquiry-modal.component.html',
  styleUrls: []
})
export class InquiryModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly inquiryService = inject(InquiryService);
  readonly authService = inject(AuthService);

  readonly property = input<Property | null>(null);
  readonly isOpen = input<boolean>(false);

  readonly close = output<void>();
  readonly submitted = output<InquiryDto>();

  readonly submitting = signal<boolean>(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  inquiryForm: FormGroup = this.fb.group({
    message: ['', [Validators.required, Validators.minLength(5)]],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^[+]?[0-9\s-]{7,15}$/)]]
  });

  onClose(): void {
    this.resetForm();
    this.close.emit();
  }

  onSubmit(): void {
    if (this.inquiryForm.invalid || !this.property()) {
      this.inquiryForm.markAllAsTouched();
      return;
    }

    const currentProp = this.property()!;
    this.submitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const formValue = this.inquiryForm.value;

    this.inquiryService.createInquiry(
      {
        propertyId: currentProp.id,
        message: formValue.message.trim(),
        phoneNumber: formValue.phoneNumber.trim()
      },
      currentProp.title
    ).subscribe({
      next: (result) => {
        this.submitting.set(false);
        this.successMessage.set('تم إرسال استفسارك بنجاح! سيتم التواصل معك قريباً.');
        this.submitted.emit(result);
        setTimeout(() => {
          this.onClose();
        }, 1800);
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(err?.error?.error || 'حدث خطأ أثناء إرسال الاستفسار. يرجى المحاولة لاحقاً.');
      }
    });
  }

  private resetForm(): void {
    this.inquiryForm.reset();
    this.successMessage.set(null);
    this.errorMessage.set(null);
    this.submitting.set(false);
  }
}
