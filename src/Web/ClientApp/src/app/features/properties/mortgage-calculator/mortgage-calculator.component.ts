import { Component, input, output, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CurrencyService } from '../../../core/services/currency.service';

@Component({
  selector: 'app-mortgage-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mortgage-calculator.component.html',
  styleUrls: []
})
export class MortgageCalculatorComponent implements OnInit {
  readonly currencyService = inject(CurrencyService);

  // Inputs
  readonly initialPrice = input<number>(250000);
  readonly isModal = input<boolean>(false);
  readonly isOpen = input<boolean>(true);
  readonly close = output<void>();

  // State
  readonly propertyPrice = signal<number>(250000);
  readonly downPaymentPercent = signal<number>(20);
  readonly loanTermYears = signal<number>(10);
  readonly annualInterestRate = signal<number>(5.5);

  ngOnInit(): void {
    if (this.initialPrice() && this.initialPrice() > 0) {
      this.propertyPrice.set(this.initialPrice());
    }
  }

  // Calculations
  readonly downPaymentAmount = computed<number>(() => {
    return Math.round((this.propertyPrice() * this.downPaymentPercent()) / 100);
  });

  readonly loanPrincipal = computed<number>(() => {
    return Math.max(0, this.propertyPrice() - this.downPaymentAmount());
  });

  readonly monthlyInterestRate = computed<number>(() => {
    return (this.annualInterestRate() / 100) / 12;
  });

  readonly totalMonths = computed<number>(() => {
    return this.loanTermYears() * 12;
  });

  readonly monthlyPayment = computed<number>(() => {
    const p = this.loanPrincipal();
    const r = this.monthlyInterestRate();
    const n = this.totalMonths();

    if (p <= 0 || n <= 0) return 0;
    if (r === 0) return Math.round(p / n);

    // Amortization formula: M = P [ i(1 + i)^n ] / [ (1 + i)^n – 1]
    const factor = Math.pow(1 + r, n);
    const payment = p * (r * factor) / (factor - 1);
    return Math.round(payment);
  });

  readonly totalRepayment = computed<number>(() => {
    return Math.round(this.monthlyPayment() * this.totalMonths());
  });

  readonly totalInterest = computed<number>(() => {
    return Math.max(0, this.totalRepayment() - this.loanPrincipal());
  });

  readonly principalPercent = computed<number>(() => {
    const total = this.totalRepayment();
    if (total <= 0) return 100;
    return Math.round((this.loanPrincipal() / total) * 100);
  });

  readonly interestPercent = computed<number>(() => {
    return 100 - this.principalPercent();
  });

  // Helpers
  setTerm(years: number): void {
    this.loanTermYears.set(years);
  }

  setDownPayment(percent: number): void {
    this.downPaymentPercent.set(percent);
  }

  onPriceChange(event: Event): void {
    const val = Number((event.target as HTMLInputElement).value);
    if (!isNaN(val) && val >= 0) {
      this.propertyPrice.set(val);
    }
  }

  formatPrice(amountInUsd: number): string {
    return this.currencyService.formatPrice(amountInUsd);
  }

  onClose(): void {
    this.close.emit();
  }
}
