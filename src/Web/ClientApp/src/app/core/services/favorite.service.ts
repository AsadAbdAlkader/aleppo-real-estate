import { Injectable, inject, signal, computed, isDevMode } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Property } from '../models/property.model';
import { FavoriteResponse } from '../models/favorite.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class FavoriteService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = '/api/favorites';

  private readonly STORAGE_KEY = 'dev_user_favorites';

  // Signals for local state management
  readonly favorites = signal<Property[]>(this.getInitialStoredFavorites());
  readonly loading = signal<boolean>(false);
  readonly favoriteIds = computed(() => new Set(this.favorites().map(p => p.id)));
  readonly favoritesCount = computed(() => this.favorites().length);

  constructor() {
    // If authenticated, automatically sync favorites from backend API
    if (this.authService.isAuthenticated()) {
      this.loadFavorites().subscribe();
    }
  }

  /**
   * Fetches user's favorited properties from backend API.
   */
  loadFavorites(): Observable<Property[]> {
    this.loading.set(true);
    return this.http.get<Property[]>(this.apiUrl).pipe(
      tap((properties) => {
        this.favorites.set(properties || []);
        this.loading.set(false);
        this.saveToStorage(properties || []);
      }),
      catchError((err) => {
        this.loading.set(false);
        if (isDevMode()) {
          console.warn('API getFavorites call failed. Loading dev-mode stored favorites.', err);
          const localFavorites = this.getInitialStoredFavorites();
          this.favorites.set(localFavorites);
          return of(localFavorites);
        }
        return of([]);
      })
    );
  }

  /**
   * Adds a property to current user's favorites.
   */
  addFavorite(property: Property): Observable<FavoriteResponse> {
    return this.http.post<FavoriteResponse>(`${this.apiUrl}/${property.id}`, {}).pipe(
      tap(() => {
        this.updateFavoriteState(property, true);
      }),
      catchError((err) => {
        if (isDevMode()) {
          console.warn('API addFavorite call failed. Triggering dev-mode fallback.', err);
          this.updateFavoriteState(property, true);
          return of({ propertyId: property.id, isFavorite: true });
        }
        return of({ propertyId: property.id, isFavorite: false });
      })
    );
  }

  /**
   * Removes a property from current user's favorites.
   */
  removeFavorite(propertyId: string): Observable<FavoriteResponse> {
    return this.http.delete<FavoriteResponse>(`${this.apiUrl}/${propertyId}`).pipe(
      tap(() => {
        this.updateFavoriteStateById(propertyId, false);
      }),
      catchError((err) => {
        if (isDevMode()) {
          console.warn('API removeFavorite call failed. Triggering dev-mode fallback.', err);
          this.updateFavoriteStateById(propertyId, false);
          return of({ propertyId, isFavorite: false });
        }
        return of({ propertyId, isFavorite: true });
      })
    );
  }

  /**
   * Toggles favorite status for a given property.
   */
  toggleFavorite(property: Property): Observable<FavoriteResponse> {
    if (this.isFavorite(property.id)) {
      return this.removeFavorite(property.id);
    } else {
      return this.addFavorite(property);
    }
  }

  /**
   * Checks whether a property ID is in favorites.
   */
  isFavorite(propertyId: string): boolean {
    return this.favoriteIds().has(propertyId);
  }

  private updateFavoriteState(property: Property, add: boolean): void {
    const current = this.favorites();
    let updated: Property[];
    if (add) {
      if (!current.some(p => p.id === property.id)) {
        updated = [property, ...current];
      } else {
        updated = current;
      }
    } else {
      updated = current.filter(p => p.id !== property.id);
    }
    this.favorites.set(updated);
    this.saveToStorage(updated);
  }

  private updateFavoriteStateById(propertyId: string, add: boolean): void {
    const current = this.favorites();
    if (!add) {
      const updated = current.filter(p => p.id !== propertyId);
      this.favorites.set(updated);
      this.saveToStorage(updated);
    }
  }

  private saveToStorage(items: Property[]): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
      } catch (e) {
        console.error('Failed to save favorites to localStorage', e);
      }
    }
  }

  private getInitialStoredFavorites(): Property[] {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored) as Property[];
        } catch {
          return [];
        }
      }
    }
    return [];
  }
}
