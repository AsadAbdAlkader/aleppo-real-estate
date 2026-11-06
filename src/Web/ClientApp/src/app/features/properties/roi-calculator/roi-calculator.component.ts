import { Component, Input, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CurrencyService } from '../../../core/services/currency.service';

@Component({
  selector: 'app-roi-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-gradient-to-br from-slate-900 via-ink-950 to-slate-900 border border-amber-500/30 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
      <!-- Background subtle glow -->
      <div class="absolute -top-24 -left-24 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-24 -right-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/10 relative z-10">
        <div>
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-bold mb-2">
            <span>📈</span>
            <span>تحليل الجدوى الاستثمارية</span>
          </div>
          <h3 class="text-xl md:text-2xl font-black text-white">حاسبة العائد الاستثماري (Rental Yield & ROI)</h3>
          <p class="text-xs md:text-sm text-slate-400 mt-1">
            تقدير العوائد الإيجارية وفترة استرداد رأس المال لعقار: <span class="text-amber-300 font-bold">{{ propertyTitle }}</span>
          </p>
        </div>

        <!-- Investment Grade Badge -->
        <div class="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-3.5">
          <div class="text-3xl">{{ investmentGrade().icon }}</div>
          <div class="text-right">
            <span class="block text-[11px] text-slate-400 font-bold">تصنيف الجدوى الاستثمارية</span>
            <span class="text-sm font-black" [ngClass]="investmentGrade().colorClass">
              {{ investmentGrade().label }}
            </span>
          </div>
        </div>
      </div>

      <!-- Calculation Metrics Grid -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 relative z-10">
        <!-- Gross Yield -->
        <div class="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
          <span class="block text-xs font-bold text-slate-400 mb-1">العائد الإجمالي (Gross Yield)</span>
          <span class="text-2xl font-black text-amber-400 font-mono">{{ grossYield().toFixed(2) }}%</span>
          <span class="block text-[10px] text-slate-500 mt-1">سنوياً قبل المصاريف</span>
        </div>

        <!-- Net Yield / ROI -->
        <div class="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-center">
          <span class="block text-xs font-bold text-emerald-300 mb-1">العائد الصافي (Net ROI)</span>
          <span class="text-2xl font-black text-emerald-400 font-mono">{{ netRoi().toFixed(2) }}%</span>
          <span class="block text-[10px] text-emerald-300/80 mt-1">صافي الربح السنوي</span>
        </div>

        <!-- Net Annual Cashflow -->
        <div class="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
          <span class="block text-xs font-bold text-slate-400 mb-1">صافي الدخل السنوي</span>
          <span class="text-lg md:text-xl font-black text-white font-mono">{{ formatCurrency(netAnnualIncome()) }}</span>
          <span class="block text-[10px] text-slate-500 mt-1">تدفق نقدي تقديري</span>
        </div>

        <!-- Payback Period -->
        <div class="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
          <span class="block text-xs font-bold text-slate-400 mb-1">فترة استرداد رأس المال</span>
          <span class="text-2xl font-black text-amber-300 font-mono">{{ paybackYears().toFixed(1) }} <span class="text-xs">سنة</span></span>
          <span class="block text-[10px] text-slate-500 mt-1">لاسترجاع كامل الثمن</span>
        </div>
      </div>

      <!-- Interactive Inputs -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-white/10 relative z-10 text-right">
        <!-- Monthly Rent Input -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold text-slate-300">الإيجار الشهري المتوقع</span>
            <span class="text-xs font-black text-amber-400 font-mono">{{ formatCurrency(monthlyRent()) }}</span>
          </div>
          <input
            type="range"
            [min]="minRent()"
            [max]="maxRent()"
            [step]="rentStep()"
            [ngModel]="monthlyRent()"
            (ngModelChange)="monthlyRent.set($event)"
            class="w-full accent-amber-400 cursor-pointer"
          />
          <div class="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>{{ formatCurrency(minRent()) }}</span>
            <span>{{ formatCurrency(maxRent()) }}</span>
          </div>
        </div>

        <!-- Maintenance & Vacancy % Slider -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold text-slate-300">تكاليف الصيانة ونسبة الشغور</span>
            <span class="text-xs font-black text-amber-400 font-mono">{{ maintenancePercent() }}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="25"
            step="1"
            [ngModel]="maintenancePercent()"
            (ngModelChange)="maintenancePercent.set($event)"
            class="w-full accent-amber-400 cursor-pointer"
          />
          <div class="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>0% (بدون مصاريف)</span>
            <span>25% (صيانة دورية وشغور)</span>
          </div>
        </div>

        <!-- 5-Year Projected Appreciation -->
        <div class="bg-white/5 rounded-2xl p-4 border border-white/10 flex flex-col justify-center">
          <span class="text-xs font-bold text-slate-400 mb-1">الربح التراكمي المقدر خلال 5 سنوات:</span>
          <span class="text-lg font-black text-emerald-400 font-mono">{{ formatCurrency(fiveYearCumulativeReturn()) }}</span>
          <span class="text-[10px] text-slate-400 mt-1">يشمل الأرباح الإيجارية مع نمو رأسمالي سنوي تقديري 4%</span>
        </div>
      </div>
    </div>
  `
})
export class PropertyRoiCalculatorComponent implements OnInit {
  @Input() propertyPrice = 250000;
  @Input() propertyTitle = 'عقار استثماري';
  @Input() purpose = 'Sale';

  private readonly currencyService = inject(CurrencyService);

  readonly monthlyRent = signal<number>(1500);
  readonly maintenancePercent = signal<number>(10);

  readonly minRent = computed(() => Math.round((this.propertyPrice * 0.03) / 12));
  readonly maxRent = computed(() => Math.max(Math.round((this.propertyPrice * 0.14) / 12), 500));
  readonly rentStep = computed(() => Math.max(Math.round(this.minRent() / 10), 50));

  ngOnInit(): void {
    // Default smart monthly rent ~ 7% annual yield
    const defaultAnnualRent = this.propertyPrice * 0.07;
    this.monthlyRent.set(Math.round(defaultAnnualRent / 12));
  }

  readonly annualRent = computed(() => this.monthlyRent() * 12);

  readonly grossYield = computed(() => {
    if (this.propertyPrice <= 0) return 0;
    return (this.annualRent() / this.propertyPrice) * 100;
  });

  readonly annualExpenses = computed(() => {
    return this.annualRent() * (this.maintenancePercent() / 100);
  });

  readonly netAnnualIncome = computed(() => {
    return Math.max(0, this.annualRent() - this.annualExpenses());
  });

  readonly netRoi = computed(() => {
    if (this.propertyPrice <= 0) return 0;
    return (this.netAnnualIncome() / this.propertyPrice) * 100;
  });

  readonly paybackYears = computed(() => {
    const net = this.netAnnualIncome();
    if (net <= 0) return 99;
    return this.propertyPrice / net;
  });

  readonly fiveYearCumulativeReturn = computed(() => {
    const rentalCashflow5Y = this.netAnnualIncome() * 5;
    const capitalGrowth5Y = this.propertyPrice * 0.20; // 4% per year compounded ~ 20%
    return rentalCashflow5Y + capitalGrowth5Y;
  });

  readonly investmentGrade = computed(() => {
    const roi = this.netRoi();
    if (roi >= 8) {
      return {
        label: 'عائد مرتفع جداً (فرصة ممتازة)',
        colorClass: 'text-emerald-400',
        icon: '💎'
      };
    }
    if (roi >= 5.5) {
      return {
        label: 'عائد جيد ومجدٍ استثمارياً',
        colorClass: 'text-amber-400',
        icon: '⭐'
      };
    }
    return {
      label: 'عائد نمو رأسمالي متزن',
      colorClass: 'text-sky-400',
      icon: '🛡️'
    };
  });

  formatCurrency(amount: number): string {
    return this.currencyService.formatPrice(amount);
  }
}
