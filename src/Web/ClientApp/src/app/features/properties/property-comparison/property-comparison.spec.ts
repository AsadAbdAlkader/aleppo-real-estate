import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PropertyComparisonComponent } from './property-comparison.component';
import { ComparisonService } from '../../../core/services/comparison.service';
import { CurrencyService } from '../../../core/services/currency.service';
import { Property } from '../../../core/models/property.model';
import { provideRouter } from '@angular/router';

describe('PropertyComparisonComponent', () => {
  let component: PropertyComparisonComponent;
  let fixture: ComponentFixture<PropertyComparisonComponent>;
  let comparisonService: ComparisonService;

  const mockProp: Property = {
    id: 'comp-1',
    title: 'شقة في الشهباء',
    description: 'شقة راقية',
    price: 300000,
    category: 'Apartment',
    purpose: 'Sale',
    cityArea: 'الشهباء',
    address: 'شارع النيل',
    bedrooms: 4,
    bathrooms: 2,
    areaSquareMeters: 200,
    imageUrls: ['https://example.com/photo.jpg'],
    status: 'Available',
    isFeatured: true,
    createdAt: new Date().toISOString()
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyComparisonComponent],
      providers: [
        ComparisonService,
        CurrencyService,
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PropertyComparisonComponent);
    component = fixture.componentInstance;
    comparisonService = TestBed.inject(ComparisonService);
    fixture.detectChanges();
  });

  it('should create PropertyComparisonComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate price per square meter correctly', () => {
    const priceM2 = component.getPricePerSquareMeter(mockProp);
    // 300,000 / 200 = 1,500
    expect(priceM2).toContain('1,500');
  });

  it('should return labels for category and purpose', () => {
    expect(component.getCategoryLabel('Apartment')).toBe('شقة سكنية');
    expect(component.getCategoryLabel('Villa')).toBe('فيلا مستقلة');
    expect(component.getPurposeLabel('Sale')).toBe('للبيع');
    expect(component.getPurposeLabel('Rent')).toBe('للإيجار');
  });

  it('should return appropriate badge class for property status', () => {
    const badge = component.getStatusBadge('Available');
    expect(badge.label).toBe('متاح');
    expect(badge.css).toContain('emerald');
  });
});
