import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: []
})
export class DashboardComponent implements OnInit {
  readonly dashboardService = inject(DashboardService);
  readonly authService = inject(AuthService);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.dashboardService.loadDashboardData().subscribe();
  }

  getRoleBadge(role?: string): { label: string; class: string } {
    const r = role || this.authService.userRole() || 'Buyer';
    switch (r) {
      case 'Agent':
        return { label: 'وكيل عقاري', class: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'Admin':
        return { label: 'مدير النظام', class: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'Buyer':
      default:
        return { label: 'مشتري', class: 'bg-sky-100 text-sky-800 border-sky-200' };
    }
  }

  getCategoryLabel(category?: string): string {
    switch (category) {
      case 'Apartment':
        return 'شقة سكنية';
      case 'Villa':
        return 'فيلا';
      case 'Commercial':
        return 'محل / مكتب تجاري';
      case 'Land':
        return 'أرض';
      default:
        return category || 'عقار';
    }
  }

  getStatusBadge(status?: string): { label: string; class: string } {
    switch (status) {
      case 'Available':
        return { label: 'متاح', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'Sold':
        return { label: 'مباع', class: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'Rented':
        return { label: 'مؤجر', class: 'bg-amber-50 text-amber-700 border-amber-200' };
      default:
        return { label: status || 'غير محدد', class: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('ar-SY', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('ar-SY', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
    } catch {
      return dateStr;
    }
  }
}
