import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InquiryService } from '../../core/services/inquiry.service';
import { InquiryStatus } from '../../core/models/inquiry.model';

@Component({
  selector: 'app-my-inquiries',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './my-inquiries.component.html',
  styleUrls: []
})
export class MyInquiriesComponent implements OnInit {
  readonly inquiryService = inject(InquiryService);

  ngOnInit(): void {
    this.inquiryService.getMyInquiries().subscribe();
  }

  getStatusBadge(status?: InquiryStatus): { label: string; class: string } {
    switch (status) {
      case 'Contacted':
        return { label: 'تم التواصل', class: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'Closed':
        return { label: 'مغلق', class: 'bg-slate-100 text-slate-700 border-slate-200' };
      case 'New':
      default:
        return { label: 'جديد', class: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
  }
}
