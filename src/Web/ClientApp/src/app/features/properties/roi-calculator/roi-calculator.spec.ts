import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PropertyRoiCalculatorComponent } from './roi-calculator.component';
import { CurrencyService } from '../../../core/services/currency.service';

describe('PropertyRoiCalculatorComponent', () => {
  let component: PropertyRoiCalculatorComponent;
  let fixture: ComponentFixture<PropertyRoiCalculatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyRoiCalculatorComponent],
      providers: [CurrencyService]
    }).compileComponents();

    fixture = TestBed.createComponent(PropertyRoiCalculatorComponent);
    component = fixture.componentInstance;
    component.propertyPrice = 200000;
    component.propertyTitle = 'شقة استثمارية بالفرقان';
    fixture.detectChanges();
  });

  it('should initialize and calculate smart monthly rent default', () => {
    expect(component).toBeTruthy();
    // Default rent ~ 7% annual yield on 200,000 -> 14,000 / 12 ~ 1,167
    expect(component.monthlyRent()).toBeGreaterThan(1000);
    expect(component.monthlyRent()).toBeLessThan(1500);
  });

  it('should compute gross yield correctly', () => {
    component.monthlyRent.set(1000); // 12,000 / year on 200,000 = 6%
    expect(component.grossYield()).toBeCloseTo(6.0, 1);
  });

  it('should compute net ROI deducting maintenance expenses', () => {
    component.monthlyRent.set(1000); // 12,000 annual
    component.maintenancePercent.set(10); // 1,200 expenses -> 10,800 net
    // 10,800 / 200,000 * 100 = 5.4%
    expect(component.netRoi()).toBeCloseTo(5.4, 1);
  });

  it('should compute payback years accurately', () => {
    component.monthlyRent.set(2000); // 24,000 annual
    component.maintenancePercent.set(0); // 24,000 net
    // 200,000 / 24,000 = 8.33 years
    expect(component.paybackYears()).toBeCloseTo(8.33, 1);
  });

  it('should assign correct investment grade labels', () => {
    // High yield case:
    component.monthlyRent.set(2000); // Net > 8%
    component.maintenancePercent.set(5);
    expect(component.investmentGrade().label).toContain('عائد مرتفع');
  });
});
