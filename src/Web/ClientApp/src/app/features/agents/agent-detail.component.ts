import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AgentService } from '../../core/services/agent.service';
import { AgentDetails } from '../../core/models/agent.model';
import { Property } from '../../core/models/property.model';
import { PropertyCardComponent } from '../properties/property-card/property-card.component';
import { InquiryModalComponent } from '../inquiries/inquiry-modal.component';

@Component({
  selector: 'app-agent-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, PropertyCardComponent, InquiryModalComponent],
  templateUrl: './agent-detail.component.html',
  styleUrls: []
})
export class AgentDetailComponent implements OnInit, OnDestroy {
  private readonly agentService = inject(AgentService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private routeSub?: Subscription;
  private querySub?: Subscription;

  // State Signals
  agentId = signal<string | null>(null);
  agent = signal<AgentDetails | null>(null);
  properties = signal<Property[]>([]);
  totalCount = signal<number>(0);
  totalPages = signal<number>(1);
  pageNumber = signal<number>(1);
  pageSize = signal<number>(6);

  isLoadingAgent = signal<boolean>(true);
  isLoadingProperties = signal<boolean>(true);
  is404 = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  // Inquiry Modal State Signals
  selectedInquiryProperty = signal<Property | null>(null);
  isInquiryModalOpen = signal<boolean>(false);

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
    this.routeSub = this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.agentId.set(id);
        this.loadAgentDetails(id);
      } else {
        this.is404.set(true);
        this.isLoadingAgent.set(false);
      }
    });

    this.querySub = this.route.queryParams.subscribe(queryParams => {
      const page = queryParams['pageNumber'] ? Number(queryParams['pageNumber']) : 1;
      this.pageNumber.set(page);

      const id = this.agentId();
      if (id) {
        this.loadAgentProperties(id, page);
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    this.querySub?.unsubscribe();
  }

  loadAgentDetails(id: string): void {
    this.isLoadingAgent.set(true);
    this.is404.set(false);
    this.errorMessage.set(null);

    this.agentService.getAgentById(id).subscribe({
      next: (agent) => {
        this.agent.set(agent);
        this.isLoadingAgent.set(false);
      },
      error: (err) => {
        console.error('Error fetching agent details:', err);
        if (err?.status === 404) {
          this.is404.set(true);
        } else {
          this.errorMessage.set('تعذر تحميل تفاصيل الوكيل. يرجى المحاولة لاحقاً.');
        }
        this.isLoadingAgent.set(false);
      }
    });
  }

  loadAgentProperties(id: string, page: number): void {
    this.isLoadingProperties.set(true);

    this.agentService.getAgentProperties(id, page, this.pageSize()).subscribe({
      next: (result) => {
        this.properties.set(result.items);
        this.totalCount.set(result.totalCount);
        this.totalPages.set(result.totalPages);
        this.isLoadingProperties.set(false);
      },
      error: (err) => {
        console.error('Error fetching agent properties:', err);
        this.isLoadingProperties.set(false);
      }
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

  openInquiryModal(property: Property): void {
    this.selectedInquiryProperty.set(property);
    this.isInquiryModalOpen.set(true);
  }

  closeInquiryModal(): void {
    this.isInquiryModalOpen.set(false);
    this.selectedInquiryProperty.set(null);
  }

  retry(): void {
    const id = this.agentId();
    if (id) {
      this.loadAgentDetails(id);
      this.loadAgentProperties(id, this.pageNumber());
    }
  }
}
