import { Injectable, signal, computed } from '@angular/core';

export type CurrencyCode = 'USD' | 'SYP' | 'EUR';

export interface CurrencyConfig {
  code: CurrencyCode;
  name: string;
  symbol: string;
  rateAgainstUsd: number; // e.g. 1 USD = 14,800 SYP
  isPrefix: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  private readonly STORAGE_KEY = 'aleppo_real_estate_currency';
  private readonly RATE_STORAGE_KEY = 'aleppo_real_estate_syp_rate';

  private readonly currencies: Record<CurrencyCode, CurrencyConfig> = {
    USD: { code: 'USD', name: 'دولار أمريكي', symbol: '$', rateAgainstUsd: 1, isPrefix: true },
    SYP: { code: 'SYP', name: 'ليرة سورية', symbol: 'ل.س', rateAgainstUsd: 14800, isPrefix: false },
    EUR: { code: 'EUR', name: 'يورو', symbol: '€', rateAgainstUsd: 0.92, isPrefix: true }
  };

  readonly currentCurrency = signal<CurrencyCode>('USD');
  readonly sypExchangeRate = signal<number>(14800);

  readonly availableCurrencies = computed<CurrencyConfig[]>(() => [
    this.currencies.USD,
    { ...this.currencies.SYP, rateAgainstUsd: this.sypExchangeRate() },
    this.currencies.EUR
  ]);

  readonly activeCurrencyConfig = computed<CurrencyConfig>(() => {
    const code = this.currentCurrency();
    const config = this.currencies[code] || this.currencies.USD;
    if (code === 'SYP') {
      return { ...config, rateAgainstUsd: this.sypExchangeRate() };
    }
    return config;
  });

  constructor() {
    this.loadFromStorage();
  }

  setCurrency(code: CurrencyCode): void {
    if (this.currencies[code]) {
      this.currentCurrency.set(code);
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(this.STORAGE_KEY, code);
      }
    }
  }

  setSypExchangeRate(rate: number): void {
    if (rate > 0) {
      this.sypExchangeRate.set(rate);
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(this.RATE_STORAGE_KEY, rate.toString());
      }
    }
  }

  convert(amountInUsd: number): { amount: number; formatted: string; symbol: string; code: CurrencyCode } {
    const config = this.activeCurrencyConfig();
    const converted = amountInUsd * config.rateAgainstUsd;

    // Formatting based on magnitude
    let formatted: string;
    if (config.code === 'SYP') {
      formatted = Math.round(converted).toLocaleString('ar-SY');
    } else {
      formatted = Math.round(converted).toLocaleString('en-US');
    }

    return {
      amount: converted,
      formatted,
      symbol: config.symbol,
      code: config.code
    };
  }

  formatPrice(amountInUsd: number): string {
    const { formatted, symbol, code } = this.convert(amountInUsd);
    const config = this.currencies[code];
    if (config.isPrefix) {
      return `${symbol}${formatted}`;
    }
    return `${formatted} ${symbol}`;
  }

  private loadFromStorage(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const savedCurrency = localStorage.getItem(this.STORAGE_KEY) as CurrencyCode;
        if (savedCurrency && this.currencies[savedCurrency]) {
          this.currentCurrency.set(savedCurrency);
        }
        const savedRate = localStorage.getItem(this.RATE_STORAGE_KEY);
        if (savedRate) {
          const parsed = parseFloat(savedRate);
          if (!isNaN(parsed) && parsed > 0) {
            this.sypExchangeRate.set(parsed);
          }
        }
      } catch {}
    }
  }
}
