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
  inject,
  signal,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import type * as LeafletType from 'leaflet';
import { Property } from '../../../core/models/property.model';
import { CurrencyService } from '../../../core/services/currency.service';
import { ThemeService } from '../../../core/services/theme.service';

export interface AleppoNeighborhood {
  name: string;
  lat: number;
  lng: number;
  zoom: number;
}

@Component({
  selector: 'app-property-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './property-map.component.html',
  styleUrls: ['./property-map.component.css']
})
export class PropertyMapComponent implements OnInit, OnDestroy, OnChanges {
  @Input() properties: Property[] = [];
  @Output() selectProperty = new EventEmitter<Property>();
  @Output() openAdvancedFilters = new EventEmitter<void>();
  @Output() quickFilterChange = new EventEmitter<{ key: string; value: any }>();

  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('outerMapWrap', { static: false }) outerMapWrap!: ElementRef<HTMLDivElement>;

  private readonly currencyService = inject(CurrencyService);
  readonly themeService = inject(ThemeService);

  readonly mapType = signal<'streets' | 'satellite'>('streets');

  private map: LeafletType.Map | null = null;
  private markersLayer: LeafletType.LayerGroup | null = null;
  private tileLayer: LeafletType.TileLayer | null = null;
  private L: typeof LeafletType | null = null;

  selectedNeighborhood = 'الكل';

  readonly neighborhoods: AleppoNeighborhood[] = [
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

  constructor() {
    effect(() => {
      // Reactively re-render when theme or basemap type changes
      this.themeService.isDark();
      this.mapType();
      if (this.map && this.L) {
        this.updateTileLayer();
        this.updateMarkers();
      }
    });
  }

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

    this.map = this.L.map(this.mapContainer.nativeElement, {
      zoomControl: false,
      attributionControl: false
    }).setView([36.2150, 37.1350], 13);

    this.updateTileLayer();
    this.markersLayer = this.L.layerGroup().addTo(this.map);
    this.updateMarkers();

    setTimeout(() => {
      this.fitAllMarkers();
    }, 200);
  }

  setMapType(type: 'streets' | 'satellite'): void {
    this.mapType.set(type);
    this.updateTileLayer();
  }

  private updateTileLayer(): void {
    if (!this.map || !this.L) return;

    if (this.tileLayer) {
      this.map.removeLayer(this.tileLayer);
      this.tileLayer = null;
    }

    if (this.mapType() === 'satellite') {
      // High-resolution Esri World Imagery (Watermark-Free Satellite Photography)
      this.tileLayer = this.L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 19,
          attribution: 'Esri Satellite'
        }
      ).addTo(this.map);
    } else {
      // OpenStreetMap: High-clarity Arabic labels, streets and landmarks
      this.tileLayer = this.L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          maxZoom: 19,
          subdomains: ['a', 'b', 'c'],
          attribution: '&copy; OpenStreetMap'
        }
      ).addTo(this.map);
    }
  }

  private updateMarkers(): void {
    if (!this.markersLayer || !this.L) return;

    this.markersLayer.clearLayers();

    const isDark = this.themeService.isDark();
    const cardBg = isDark ? '#1a1a1a' : '#ffffff';
    const textColor = isDark ? '#ffffff' : '#0f172a';
    const mutedColor = isDark ? '#a8a29e' : '#64748b';
    const borderColor = isDark ? 'rgba(255,255,255,0.1)' : '#f1f5f9';

    this.properties.forEach((prop) => {
      const lat = prop.latitude || this.getFallbackLat(prop.cityArea);
      const lng = prop.longitude || this.getFallbackLng(prop.cityArea);

      if (!lat || !lng) return;

      const formattedPrice = this.currencyService.formatPrice(prop.price);

      // Custom Habitect Marker
      const icon = this.L!.divIcon({
        className: 'habitect-marker-wrap',
        html: `<div class="habitect-marker">${formattedPrice}</div>`,
        iconSize: [85, 34],
        iconAnchor: [42, 34]
      });

      const marker = this.L!.marker([lat, lng], { icon });

      // Habitect Floating Preview Card
      const thumb = prop.imageUrls?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400';
      const popupHtml = `
        <div style="direction: rtl; text-align: right; width: 235px; background: ${cardBg}; border-radius: 1.25rem; padding: 8px; box-shadow: 0 16px 36px rgba(0,0,0,0.22); border: 1px solid ${borderColor}; font-family: 'Tajawal', sans-serif;">
          <div style="position: relative; width: 100%; height: 115px; border-radius: 12px; overflow: hidden; margin-bottom: 8px;">
            <img src="${thumb}" alt="${prop.title}" style="width: 100%; height: 100%; object-fit: cover;" />
            <span style="position: absolute; top: 6px; right: 6px; background: rgba(0,0,0,0.75); color: #fff; font-size: 10px; font-weight: bold; padding: 2px 8px; border-radius: 9999px;">
              ${prop.purpose === 'Rent' ? 'للإيجار' : 'للبيع'}
            </span>
          </div>
          <div style="padding: 0 4px 4px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;">
              <span style="font-size: 16px; font-weight: 900; color: ${textColor};">${formattedPrice}</span>
              <span style="color: #94a3b8; font-size: 15px;">♡</span>
            </div>
            <div style="font-size: 11px; color: ${mutedColor}; margin-bottom: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              📍 حلب، ${prop.cityArea}
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 10.5px; color: ${mutedColor}; padding-top: 6px; border-top: 1px solid ${borderColor};">
              <span>🛏️ ${prop.bedrooms} غرف</span>
              <span>🚿 ${prop.bathrooms} حمام</span>
              <span>📐 ${prop.areaSquareMeters} م²</span>
            </div>
            <a href="/properties/${prop.id}" style="display: block; text-align: center; background: #c79c4a; color: #191712; font-size: 11px; font-weight: 800; padding: 6px; border-radius: 9999px; margin-top: 8px; text-decoration: none;">
              عرض التفاصيل الكاملة ←
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 260 });
      marker.on('click', () => {
        this.selectProperty.emit(prop);
      });

      this.markersLayer!.addLayer(marker);
    });

    if (this.selectedNeighborhood === 'الكل') {
      this.fitAllMarkers();
    }
  }

  fitAllMarkers(): void {
    if (!this.map || !this.markersLayer || !this.L) return;
    const layers = this.markersLayer.getLayers();
    if (layers.length > 0) {
      const group = this.L.featureGroup(layers);
      const bounds = group.getBounds();
      if (bounds.isValid()) {
        this.map.fitBounds(bounds.pad(0.18), { maxZoom: 15 });
        return;
      }
    }
    this.map.setView([36.2150, 37.1350], 13);
  }

  flyToNeighborhood(n: AleppoNeighborhood): void {
    this.selectedNeighborhood = n.name;
    if (this.map) {
      if (n.name === 'الكل') {
        this.fitAllMarkers();
      } else {
        this.map.flyTo([n.lat, n.lng], n.zoom, { duration: 1.0 });
      }
    }
  }

  toggleFullscreen(): void {
    const el = this.outerMapWrap?.nativeElement;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch((err) => console.warn(err));
    } else {
      document.exitFullscreen?.().catch((err) => console.warn(err));
    }
  }

  zoomIn(): void {
    if (this.map) this.map.zoomIn();
  }

  zoomOut(): void {
    if (this.map) this.map.zoomOut();
  }

  resetView(): void {
    this.selectedNeighborhood = 'الكل';
    this.fitAllMarkers();
  }

  onQuickPriceClick(): void {
    this.quickFilterChange.emit({ key: 'priceRange', value: { min: 50000, max: 500000 } });
  }

  onQuickCategoryClick(cat: string): void {
    this.quickFilterChange.emit({ key: 'category', value: cat });
  }

  onQuickRoomsClick(rooms: number): void {
    this.quickFilterChange.emit({ key: 'bedrooms', value: rooms });
  }

  onQuickBedsClick(baths: number): void {
    this.quickFilterChange.emit({ key: 'bathrooms', value: baths });
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
