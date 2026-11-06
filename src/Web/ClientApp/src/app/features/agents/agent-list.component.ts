import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AgentService } from '../../core/services/agent.service';
import { AuthService } from '../../core/services/auth.service';
import { Agent, AgentFilterParams, Agency } from '../../core/models/agent.model';
import { AgencyFormModalComponent } from './agency-form-modal/agency-form-modal.component';

@Component({
  selector: 'app-agent-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AgencyFormModalComponent],
  templateUrl: './agent-list.component.html',
  styleUrls: []
})
export class AgentListComponent implements OnInit, OnDestroy {
  private readonly agentService = inject(AgentService);
  readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private queryParamsSub?: Subscription;

  // State Signals
  agents = signal<Agent[]>([]);
  totalCount = signal<number>(0);
  totalPages = signal<number>(1);
  pageNumber = signal<number>(1);
  pageSize = signal<number>(9);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);

  // Agency Modal State
  isAgencyModalOpen = signal<boolean>(false);
  selectedAgencyForEdit = signal<Agency | null>(null);

  // Filter Signals
  searchTerm = signal<string>('');
  selectedCityArea = signal<string>('all');

  // Available Aleppo neighborhood list
  readonly cityAreas = [
    { value: 'all', label: 'جميع الأحياء' },
    { value: 'الشهباء', label: 'الشهباء' },
    { value: 'العزيزية', label: 'العزيزية' },
    { value: 'الفرقان', label: 'الفرقان' },
    { value: 'السبيل', label: 'السبيل' },
    { value: 'السريان', label: 'السريان' },
    { value: 'حلب الجديدة', label: 'حلب الجديدة' },
    { value: 'المحافظة', label: 'المحافظة' },
    { value: 'الأعظمية', label: 'الأعظمية' }
  ];

  // Computed helper for pagination pages array
  pagesArray = computed(() => {
    const total = this.totalPages();
    const pages: number[] = [];
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
    return pages;
  });

  ngOnInit(): void {
    this.queryParamsSub = this.route.queryParams.subscribe(params => {
      const page = params['pageNumber'] ? Number(params['pageNumber']) : 1;
      const term = params['searchTerm'] || '';
      const area = params['cityArea'] || 'all';

      this.pageNumber.set(page);
      this.searchTerm.set(term);
      this.selectedCityArea.set(area);

      this.loadAgents({
        searchTerm: term || undefined,
        cityArea: area !== 'all' ? area : undefined,
        pageNumber: page,
        pageSize: this.pageSize()
      });
    });
  }

  ngOnDestroy(): void {
    this.queryParamsSub?.unsubscribe();
  }

  loadAgents(params: AgentFilterParams): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.agentService.getAgents(params).subscribe({
      next: (result) => {
        this.agents.set(result.items);
        this.totalCount.set(result.totalCount);
        this.totalPages.set(result.totalPages);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading agents:', err);
        this.errorMessage.set('تعذر تحميل دليل الوكلاء والمكاتب. يرجى المحاولة مرة أخرى.');
        this.isLoading.set(false);
      }
    });
  }

  openAgencyModal(agency: Agency | null = null): void {
    this.selectedAgencyForEdit.set(agency);
    this.isAgencyModalOpen.set(true);
  }

  onAgencySaved(_savedAgency: Agency): void {
    this.isAgencyModalOpen.set(false);
    this.selectedAgencyForEdit.set(null);
    this.retry();
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
    this.applyFilters();
  }

  onCityAreaChange(area: string): void {
    this.selectedCityArea.set(area);
    this.applyFilters();
  }

  applyFilters(): void {
    const queryParams: Record<string, string | number | undefined> = {
      pageNumber: 1
    };

    if (this.searchTerm().trim()) {
      queryParams['searchTerm'] = this.searchTerm().trim();
    }
    if (this.selectedCityArea() !== 'all') {
      queryParams['cityArea'] = this.selectedCityArea();
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: ''
    });
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedCityArea.set('all');
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {}
    });
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages() && page !== this.pageNumber()) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { pageNumber: page },
        queryParamsHandling: 'merge'
      });
    }
  }

  retry(): void {
    this.loadAgents({
      searchTerm: this.searchTerm() || undefined,
      cityArea: this.selectedCityArea() !== 'all' ? this.selectedCityArea() : undefined,
      pageNumber: this.pageNumber(),
      pageSize: this.pageSize()
    });
  }
}
