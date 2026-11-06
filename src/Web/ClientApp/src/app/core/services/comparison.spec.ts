import { TestBed } from '@angular/core/testing';
import { ComparisonService } from './comparison.service';
import { Property } from '../models/property.model';

describe('ComparisonService', () => {
  let service: ComparisonService;

  const mockProperty1: Property = {
    id: 'prop-1',
    title: 'شقة في الشهباء',
    description: 'شقة فاخرة',
    price: 200000,
    category: 'Apartment',
    purpose: 'Sale',
    cityArea: 'الشهباء',
    address: 'شارع النيل',
    bedrooms: 3,
    bathrooms: 2,
    areaSquareMeters: 160,
    imageUrls: ['https://example.com/1.jpg'],
    status: 'Available',
    isFeatured: true,
    createdAt: new Date().toISOString()
  };

  const mockProperty2: Property = {
    id: 'prop-2',
    title: 'فيلا في الفرقان',
    description: 'فيلا مستقلة',
    price: 500000,
    category: 'Villa',
    purpose: 'Sale',
    cityArea: 'الفرقان',
    address: 'شارع الجامعة',
    bedrooms: 5,
    bathrooms: 4,
    areaSquareMeters: 380,
    imageUrls: ['https://example.com/2.jpg'],
    status: 'Available',
    isFeatured: false,
    createdAt: new Date().toISOString()
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [ComparisonService]
    });
    service = TestBed.inject(ComparisonService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should initialize with empty comparison list', () => {
    expect(service.comparedProperties().length).toBe(0);
    expect(service.hasProperties()).toBe(false);
  });

  it('should add property to comparison', () => {
    const res = service.toggleProperty(mockProperty1);
    expect(res.added).toBe(true);
    expect(service.comparedProperties().length).toBe(1);
    expect(service.isInComparison(mockProperty1.id)).toBe(true);
  });

  it('should remove property if toggled again', () => {
    service.toggleProperty(mockProperty1);
    const res = service.toggleProperty(mockProperty1);
    expect(res.added).toBe(false);
    expect(service.comparedProperties().length).toBe(0);
    expect(service.isInComparison(mockProperty1.id)).toBe(false);
  });

  it('should not allow more than MAX_COMPARE_COUNT properties', () => {
    for (let i = 1; i <= 4; i++) {
      service.toggleProperty({ ...mockProperty1, id: `prop-${i}` });
    }
    expect(service.comparedProperties().length).toBe(4);

    const overflowRes = service.toggleProperty({ ...mockProperty1, id: 'prop-5' });
    expect(overflowRes.added).toBe(false);
    expect(service.comparedProperties().length).toBe(4);
  });

  it('should clear all comparison items', () => {
    service.toggleProperty(mockProperty1);
    service.toggleProperty(mockProperty2);
    expect(service.comparedProperties().length).toBe(2);

    service.clearComparison();
    expect(service.comparedProperties().length).toBe(0);
    expect(service.hasProperties()).toBe(false);
  });
});
