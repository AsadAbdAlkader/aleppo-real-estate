import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AgentService } from '../../../core/services/agent.service';
import { Agency, CreateAgencyDto, UpdateAgencyDto } from '../../../core/models/agent.model';

@Component({
  selector: 'app-agency-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './agency-form-modal.component.html',
  styleUrls: []
})
export class AgencyFormModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly agentService = inject(AgentService);

  @Input() agency: Agency | null = null;
  @Output() closed = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<Agency>();

  readonly isSubmitting = signal<boolean>(false);
  readonly errorMsg = signal<string | null>(null);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.maxLength(2000)]],
    phoneNumber: ['', [Validators.maxLength(50)]],
    address: ['', [Validators.maxLength(300)]],
    cityArea: ['الشهباء', [Validators.maxLength(100)]],
    logoUrl: ['', [Validators.maxLength(1000)]],
    licenseNumber: ['', [Validators.maxLength(100)]]
  });

  ngOnInit(): void {
    if (this.agency) {
      this.form.patchValue({
        name: this.agency.name,
        description: this.agency.description || '',
        phoneNumber: this.agency.phoneNumber || '',
        address: this.agency.address || '',
        cityArea: this.agency.cityArea || 'الشهباء',
        logoUrl: this.agency.logoUrl || '',
        licenseNumber: this.agency.licenseNumber || ''
      });
    }
  }

  closeModal(): void {
    this.closed.emit(false);
  }

  onSubmit(): void {
    this.errorMsg.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const val = this.form.getRawValue();
    this.isSubmitting.set(true);

    if (this.agency) {
      const updateDto: UpdateAgencyDto = {
        name: val.name || undefined,
        description: val.description || undefined,
        phoneNumber: val.phoneNumber || undefined,
        address: val.address || undefined,
        cityArea: val.cityArea || undefined,
        logoUrl: val.logoUrl || undefined,
        licenseNumber: val.licenseNumber || undefined
      };

      this.agentService.updateAgency(this.agency.id, updateDto).subscribe({
        next: (updatedAgency) => {
          this.isSubmitting.set(false);
          this.saved.emit(updatedAgency);
        },
        error: (err) => {
          console.error('Error updating agency:', err);
          this.errorMsg.set('حدث خطأ أثناء تعديل بيانات المكتب العقاري.');
          this.isSubmitting.set(false);
        }
      });
    } else {
      const createDto: CreateAgencyDto = {
        name: val.name || '',
        description: val.description || undefined,
        phoneNumber: val.phoneNumber || undefined,
        address: val.address || undefined,
        cityArea: val.cityArea || 'الشهباء',
        logoUrl: val.logoUrl || undefined,
        licenseNumber: val.licenseNumber || undefined
      };

      this.agentService.createAgency(createDto).subscribe({
        next: (newAgency) => {
          this.isSubmitting.set(false);
          this.saved.emit(newAgency);
        },
        error: (err) => {
          console.error('Error creating agency:', err);
          this.errorMsg.set('حدث خطأ أثناء إنشاء المكتب العقاري.');
          this.isSubmitting.set(false);
        }
      });
    }
  }
}
