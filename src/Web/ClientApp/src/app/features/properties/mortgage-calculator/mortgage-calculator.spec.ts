import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MortgageCalculatorComponent } from './mortgage-calculator.component';
import { CurrencyService } from '../../../core/services/currency.service';

describe('MortgageCalculatorComponent', () => {
  let component: MortgageCalculatorComponent;
  let fixture: ComponentFixture<MortgageCalculatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MortgageCalculatorComponent],
      providers: [CurrencyService]
    }).compileComponents();

    fixture = TestBed.createComponent(MortgageCalculatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create MortgageCalculatorComponent with defaults', () => {
    expect(component).toBeTruthy();
    expect(component.propertyPrice()).toBe(250000);
    expect(component.downPaymentPercent()).toBe(20);
    expect(component.loanTermYears()).toBe(10);
    expect(component.annualInterestRate()).toBe(5.5);
  });

  it('should calculate down payment and loan principal correctly', () => {
    component.propertyPrice.set(100000);
    component.downPaymentPercent.set(20);
    expect(component.downPaymentAmount()).toBe(20000);
    expect(component.loanPrincipal()).toBe(80000);
  });

  it('should calculate monthly installment payment', () => {
    component.propertyPrice.set(100000);
    component.downPaymentPercent.set(20); // 80,000 principal
    component.loanTermYears.set(10); // 120 months
    component.annualInterestRate.set(6); // 6% annual

    const monthly = component.monthlyPayment();
    expect(monthly).toBeGreaterThan(0);
    expect(component.totalRepayment()).toBeGreaterThan(component.loanPrincipal());
    expect(component.totalInterest()).toBe(component.totalRepayment() - component.loanPrincipal());
  });

  it('should update duration and down payment using helper methods', () => {
    component.setTerm(15);
    expect(component.loanTermYears()).toBe(15);
    expect(component.totalMonths()).toBe(180);

    component.setDownPayment(30);
    expect(component.downPaymentPercent()).toBe(30);
  });

  it('should emit close event when onClose is called', () => {
    let closed = false;
    component.close.subscribe(() => (closed = true));
    component.onClose();
    expect(closed).toBe(true);
  });
});
