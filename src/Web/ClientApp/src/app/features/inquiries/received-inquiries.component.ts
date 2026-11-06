import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InquiryService } from '../../core/services/inquiry.service';
import { ReceivedInquiry, InquiryStatus, UpdateInquiryStatusDto } from '../../core/models/inquiry.model';
import { PaginatedResult } from '../../core/models/property.model';

@Component({
  selector: 'app-received-inquiries',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, DatePipe],
  templateUrl: './received-inquiries.component.html',
  styleUrls: []
})
export class ReceivedInquiriesComponent implements OnInit {
  private readonly inquiryService = inject(InquiryService);

  readonly selectedStatus = signal<string>('');
  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(10);

  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly paginatedResult = signal<PaginatedResult<ReceivedInquiry> | null>(null);

  // Modal State
  readonly isModalOpen = signal<boolean>(false);
  readonly selectedInquiry = signal<ReceivedInquiry | null>(null);
  readonly editStatus = signal<InquiryStatus>('New');
  readonly editAgentNotes = signal<string>('');
  readonly isSaving = signal<boolean>(false);
  readonly modalError = signal<string | null>(null);

  ngOnInit(): void {
    this.loadReceivedInquiries();
  }

  loadReceivedInquiries(): void {
    this.loading.set(true);
    this.error.set(null);

    this.inquiryService.getReceivedInquiries(
      this.selectedStatus(),
      this.currentPage(),
      this.pageSize()
    ).subscribe({
      next: (res) => {
        this.paginatedResult.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load received inquiries', err);
        this.error.set('تعذر تحميل الاستفسارات الواردة. يرجى المحاولة مرة أخرى.');
        this.loading.set(false);
      }
    });
  }

  setStatusFilter(status: string): void {
    if (this.selectedStatus() !== status) {
      this.selectedStatus.set(status);
      this.currentPage.set(1);
      this.loadReceivedInquiries();
    }
  }

  goToPage(page: number): void {
    const total = this.paginatedResult()?.totalPages || 1;
    if (page >= 1 && page <= total) {
      this.currentPage.set(page);
      this.loadReceivedInquiries();
    }
  }

  openEditModal(inquiry: ReceivedInquiry): void {
    this.selectedInquiry.set(inquiry);
    this.editStatus.set(inquiry.status || 'New');
    this.editAgentNotes.set(inquiry.agentNotes || '');
    this.modalError.set(null);
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.selectedInquiry.set(null);
    this.modalError.set(null);
  }

  saveStatusUpdate(): void {
    const inquiry = this.selectedInquiry();
    if (!inquiry) return;

    if (this.editAgentNotes().length > 2000) {
      this.modalError.set('الملاحظات يجب ألا تتجاوز 2000 حرف');
      return;
    }

    this.isSaving.set(true);
    this.modalError.set(null);

    const dto: UpdateInquiryStatusDto = {
      status: this.editStatus(),
      agentNotes: this.editAgentNotes().trim() || undefined
    };

    this.inquiryService.updateInquiryStatus(inquiry.id, dto).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.closeModal();
        this.loadReceivedInquiries();
      },
      error: (err) => {
        console.error('Failed to update inquiry status', err);
        this.modalError.set('فشل حفظ التحديثات. يرجى المحاولة لاحقاً.');
        this.isSaving.set(false);
      }
    });
  }

  getStatusBadge(status?: InquiryStatus): { label: string; class: string; dotClass: string } {
    switch (status) {
      case 'Contacted':
        return { 
          label: 'تم التواصل', 
          class: 'bg-amber-50 text-amber-700 border-amber-200',
          dotClass: 'bg-amber-500'
        };
      case 'Closed':
        return { 
          label: 'مغلق', 
          class: 'bg-slate-100 text-slate-700 border-slate-200',
          dotClass: 'bg-slate-500'
        };
      case 'New':
      default:
        return { 
          label: 'جديد', 
          class: 'bg-blue-50 text-blue-700 border-blue-200',
          dotClass: 'bg-blue-500'
        };
    }
  }
}
