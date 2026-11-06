import { TestBed } from '@angular/core/testing';
import { CurrencyService } from './currency.service';

describe('CurrencyService', () => {
  let service: CurrencyService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [CurrencyService]
    });
    service = TestBed.inject(CurrencyService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should initialize with USD as default currency', () => {
    expect(service.currentCurrency()).toBe('USD');
    expect(service.sypExchangeRate()).toBe(14800);
  });

  it('should format USD prices correctly', () => {
    const formatted = service.formatPrice(100000);
    expect(formatted).toBe('$100,000');
  });

  it('should switch currency to SYP and format appropriately', () => {
    service.setCurrency('SYP');
    expect(service.currentCurrency()).toBe('SYP');
    const { code, symbol } = service.convert(100);
    expect(code).toBe('SYP');
    expect(symbol).toBe('ل.س');
    const formatted = service.formatPrice(100);
    expect(formatted).toContain('ل.س');
  });

  it('should switch currency to EUR and format appropriately', () => {
    service.setCurrency('EUR');
    expect(service.currentCurrency()).toBe('EUR');
    const { code, symbol } = service.convert(1000);
    expect(code).toBe('EUR');
    expect(symbol).toBe('€');
  });

  it('should update SYP exchange rate', () => {
    service.setSypExchangeRate(15500);
    expect(service.sypExchangeRate()).toBe(15500);
    service.setCurrency('SYP');
    const result = service.convert(10);
    expect(result.amount).toBe(155000);
  });
});
