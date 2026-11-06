import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ElementRef,
  ViewChild,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Property } from '../../../core/models/property.model';
import { CurrencyService } from '../../../core/services/currency.service';

@Component({
  selector: 'app-property-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative w-full h-[550px] rounded-3xl overflow-hidden border border-slate-200/80 shadow-md bg-slate-100">
      
      <!-- Quick Neighborhood Filter Bar -->
      <div class="absolute top-4 inset-x-4 z-[1000] flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pointer-events-auto">
        <div class="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-sm border border-slate-200/80 flex items-center gap-1.5 flex-nowrap">
          <span class="text-xs font-bold text-slate-500 whitespace-nowrap">الأحياء:</span>
          @for (neighborhood of neighborhoods; track neighborhood.name) {
            <button
              type="button"
              (click)="flyToNeighborhood(neighborhood)"
              class="px-2.5 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer"
              [class.bg-ink-950]="selectedNeighborhood === neighborhood.name"
              [class.text-amber-300]="selectedNeighborhood === neighborhood.name"
              [class.bg-slate-100]="selectedNeighborhood !== neighborhood.name"
              [class.text-slate-700]="selectedNeighborhood !== neighborhood.name"
              [class.hover:bg-slate-200]="selectedNeighborhood !== neighborhood.name"
            >
              {{ neighborhood.name }}
            </button>
          }
        </div>
      </div>

      <!-- Map Container -->
      <div #mapContainer class="w-full h-full"></div>

      <!-- Map Overlay Controls -->
      <div class="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm text-[11px] font-bold text-slate-700 flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
        <span>{{ properties.length }} عقار معروض على الخريطة</span>
      </div>

    </div>
  `,
  styles: [`
    :host ::ng-deep .leaflet-popup-content-wrapper {
      padding: 0;
      overflow: hidden;
      border-radius: 1.25rem;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(217, 119, 6, 0.2);
    }
    :host ::ng-deep .leaflet-popup-content {
      margin: 0;
      line-height: 1.4;
    }
    :host ::ng-deep .custom-price-marker {
      background: #0f172a;
      color: #fcd34d;
      border: 1.5px solid #d97706;
      border-radius: 9999px;
      font-weight: 800;
      font-size: 11px;
      padding: 3px 8px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      white-space: nowrap;
      text-align: center;
      transition: all 0.2s ease;
      cursor: pointer;
    }
    :host ::ng-deep .custom-price-marker:hover {
      background: #d97706;
      color: #0f172a;
      transform: scale(1.1);
      z-index: 1000 !important;
    }
  `]
})
export class PropertyMapComponent implements OnInit, OnDestroy, OnChanges {
  @Input() properties: Property[] = [];
  @Output() selectProperty = new EventEmitter<Property>();

  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;

  private readonly currencyService = inject(CurrencyService);
  private readonly router = inject(Router);

  private map: any = null;
  private markersLayer: any = null;
  private L: any = null;

  selectedNeighborhood = 'الكل';

  readonly neighborhoods = [
    { name: 'الكل', lat: 36.2150, lng: 37.1350, zoom: 13 },
    { name: 'الشهباء', lat: 36.2230, lng: 37.1320, zoom: 15 },
    { name: 'الفرقان', lat: 36.2085, lng: 37.1180, zoom: 15 },
    { name: 'حلب الجديدة', lat: 36.2160, lng: 37.0980, zoom: 15 },
    { name: 'الموكامبو', lat: 36.2190, lng: 37.1260, zoom: 15 },
    { name: 'السريان', lat: 36.2250, lng: 37.1450, zoom: 15 },
    { name: 'العزيزية', lat: 36.2135, lng: 37.1510, zoom: 15 },
    { name: 'السبيل', lat: 36.2200, lng: 37.1380, zoom: 15 },
    { name: 'المحافظة', lat: 36.2055, lng: 37.1340, zoom: 15 }
  ];

  async ngOnInit(): Promise<void> {
    if (typeof window !== 'undefined') {
      try {
        this.L = await import('leaflet');
        this.initMap();
      } catch (err) {
        console.warn('Failed to load Leaflet module:', err);
      }
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['properties'] && this.map && this.L) {
      this.updateMarkers();
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private initMap(): void {
    if (!this.mapContainer?.nativeElement || !this.L) return;

    // Center on Aleppo
    this.map = this.L.map(this.mapContainer.nativeElement, {
      zoomControl: true,
      attributionControl: false
    }).setView([36.2150, 37.1350], 13);

    // OpenStreetMap tiles
    this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(this.map);

    this.markersLayer = this.L.layerGroup().addTo(this.map);
    this.updateMarkers();
  }

  private updateMarkers(): void {
    if (!this.markersLayer || !this.L) return;

    this.markersLayer.clearLayers();

    this.properties.forEach((prop) => {
      // Use assigned coordinates or fallback based on Aleppo neighborhoods
      const lat = prop.latitude || this.getFallbackLat(prop.cityArea);
      const lng = prop.longitude || this.getFallbackLng(prop.cityArea);

      if (!lat || !lng) return;

      const formattedPrice = this.currencyService.formatPrice(prop.price);

      // Custom Price Pill DivIcon
      const icon = this.L.divIcon({
        className: 'custom-price-marker-container',
        html: `<div class="custom-price-marker">${formattedPrice}</div>`,
        iconSize: [80, 26],
        iconAnchor: [40, 13]
      });

      const marker = this.L.marker([lat, lng], { icon });

      // Rich Card Popup
      const thumb = prop.imageUrls?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400';
      const popupHtml = `
        <div style="direction: rtl; text-align: right; width: 220px; font-family: 'Tajawal', sans-serif;">
          <img src="${thumb}" alt="${prop.title}" style="width: 100%; height: 110px; object-fit: cover; border-top-left-radius: 1rem; border-top-right-radius: 1rem;" />
          <div style="padding: 10px 12px;">
            <div style="color: #b45309; font-weight: 900; font-size: 13px; margin-bottom: 2px;">${formattedPrice}</div>
            <div style="font-weight: 700; font-size: 11px; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${prop.title}</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">📍 ${prop.cityArea} - ${prop.address}</div>
            <div style="display: flex; gap: 8px; font-size: 10px; color: #475569; margin-top: 6px; padding-top: 6px; border-top: 1px solid #f1f5f9;">
              <span>🛏️ ${prop.bedrooms} غرف</span>
              <span>📐 ${prop.areaSquareMeters} م²</span>
            </div>
            <a href="/properties/${prop.id}" style="display: block; text-align: center; background: #0f172a; color: #fcd34d; font-size: 10px; font-weight: 700; padding: 6px; border-radius: 8px; margin-top: 8px; text-decoration: none;">
              عرض التفاصيل الكاملة ←
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 240 });
      marker.on('click', () => {
        this.selectProperty.emit(prop);
      });

      this.markersLayer.addLayer(marker);
    });
  }

  flyToNeighborhood(n: { name: string; lat: number; lng: number; zoom: number }): void {
    this.selectedNeighborhood = n.name;
    if (this.map) {
      this.map.flyTo([n.lat, n.lng], n.zoom, { duration: 1.2 });
    }
  }

  private getFallbackLat(area: string): number {
    const a = area?.trim() || '';
    if (a.includes('فرقان')) return 36.2085;
    if (a.includes('شهباء')) return 36.2230;
    if (a.includes('جديدة')) return 36.2160;
    if (a.includes('موكامبو')) return 36.2190;
    if (a.includes('سريان')) return 36.2250;
    if (a.includes('عزيزية')) return 36.2135;
    if (a.includes('سبيل')) return 36.2200;
    return 36.2055;
  }

  private getFallbackLng(area: string): number {
    const a = area?.trim() || '';
    if (a.includes('فرقان')) return 37.1180;
    if (a.includes('شهباء')) return 37.1320;
    if (a.includes('جديدة')) return 37.0980;
    if (a.includes('موكامبو')) return 37.1260;
    if (a.includes('سريان')) return 37.1450;
    if (a.includes('عزيزية')) return 37.1510;
    if (a.includes('سبيل')) return 37.1380;
    return 37.1340;
  }
}
