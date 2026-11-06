import { Injectable, signal, computed } from '@angular/core';
import { Property } from '../models/property.model';

@Injectable({
  providedIn: 'root'
})
export class ComparisonService {
  private readonly STORAGE_KEY = 'aleppo_real_estate_compared_properties';
  readonly MAX_COMPARE_COUNT = 4;

  readonly comparedProperties = signal<Property[]>([]);
  readonly isCompareModalOpen = signal<boolean>(false);

  readonly count = computed<number>(() => this.comparedProperties().length);
  readonly hasProperties = computed<boolean>(() => this.comparedProperties().length > 0);

  constructor() {
    this.loadFromStorage();
  }

  toggleProperty(property: Property): { added: boolean; message?: string } {
    const list = this.comparedProperties();
    const existingIndex = list.findIndex(p => p.id === property.id);

    if (existingIndex >= 0) {
      const updated = list.filter(p => p.id !== property.id);
      this.comparedProperties.set(updated);
      this.saveToStorage(updated);
      return { added: false, message: 'تمت إزالة العقار من قائمة المقارنة' };
    }

    if (list.length >= this.MAX_COMPARE_COUNT) {
      return {
        added: false,
        message: `يمكنك مقارنة حتى ${this.MAX_COMPARE_COUNT} عقارات كحد أقصى في آن واحد`
      };
    }

    const updated = [...list, property];
    this.comparedProperties.set(updated);
    this.saveToStorage(updated);
    return { added: true, message: 'تمت إضافة العقار إلى قائمة المقارنة بنجاح' };
  }

  isInComparison(propertyId: string): boolean {
    return this.comparedProperties().some(p => p.id === propertyId);
  }

  removeProperty(propertyId: string): void {
    const updated = this.comparedProperties().filter(p => p.id !== propertyId);
    this.comparedProperties.set(updated);
    this.saveToStorage(updated);
  }

  clearComparison(): void {
    this.comparedProperties.set([]);
    this.saveToStorage([]);
    this.isCompareModalOpen.set(false);
  }

  openModal(): void {
    if (this.comparedProperties().length > 0) {
      this.isCompareModalOpen.set(true);
    }
  }

  closeModal(): void {
    this.isCompareModalOpen.set(false);
  }

  private saveToStorage(properties: Property[]): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(properties));
      } catch {}
    }
  }

  private loadFromStorage(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            this.comparedProperties.set(parsed);
          }
        }
      } catch {}
    }
  }
}
