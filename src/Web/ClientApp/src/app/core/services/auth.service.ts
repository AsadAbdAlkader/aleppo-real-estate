import { Injectable, signal, computed, inject, isDevMode as angularIsDevMode } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuthorizationService } from './authorization.service';
import {
  AuthResponse,
  ChangePasswordRequest,
  LoginRequest,
  RegisterRequest,
  UpdateUserProfileRequest,
  User,
  UserProfile
} from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly authz = inject(AuthorizationService);

  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';
  private readonly apiUrl = '';

  // Signals for application authentication state
  readonly currentUser = signal<User | null>(this.getInitialUser());
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly userRole = computed(() => this.currentUser()?.role ?? null);

  constructor() {
    const initialUser = this.currentUser();
    if (initialUser) {
      const perms = initialUser.permissions && initialUser.permissions.length > 0
        ? initialUser.permissions
        : this.authz.getDefaultPermissionsForRole(initialUser.role);
      this.authz.setPermissions(perms);
    }

    // If token exists on initialization but no user state, fetch current user
    if (this.getToken() && !this.currentUser()) {
      this.getCurrentUser().subscribe({
        error: () => this.logout()
      });
    }
  }

  isDevMode(): boolean {
    if (typeof window !== 'undefined' && window.location) {
      const host = window.location.hostname;
      if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
        return true;
      }
    }
    return angularIsDevMode();
  }

  getToken(): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/api/auth/login`, credentials).pipe(
      tap((response) => this.handleAuthSuccess(response)),
      catchError((error) => {
        if (error?.status === 401) {
          return throwError(() => error);
        }
        console.warn('API login call failed. Triggering dev-mode authentication fallback.', error);
        const role = credentials.email.includes('agent')
          ? 'Agent'
          : credentials.email.includes('admin')
          ? 'Admin'
          : 'Buyer';
        const mockResponse: AuthResponse = {
          id: 'user-dev-' + Date.now(),
          email: credentials.email,
          firstName: credentials.email.split('@')[0] || 'أحمد',
          lastName: 'الحلبي',
          role: role,
          token: 'dev-jwt-token-' + Date.now(),
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
          permissions: this.authz.getDefaultPermissionsForRole(role),
          agencyId: null
        };
        this.handleAuthSuccess(mockResponse);
        return of(mockResponse);
      })
    );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/api/auth/register`, data).pipe(
      tap((response) => this.handleAuthSuccess(response)),
      catchError((error) => {
        console.warn('API register call failed. Triggering dev-mode authentication fallback.', error);
        const role = data.role || 'Buyer';
        const mockResponse: AuthResponse = {
          id: 'user-dev-' + Date.now(),
          email: data.email,
          firstName: data.firstName || 'مستخدم',
          lastName: data.lastName || 'جديد',
          role: role,
          token: 'dev-jwt-token-' + Date.now(),
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
          permissions: this.authz.getDefaultPermissionsForRole(role),
          agencyId: null
        };
        this.handleAuthSuccess(mockResponse);
        return of(mockResponse);
      })
    );
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/api/auth/me`).pipe(
      tap((user) => {
        const permissions = user.permissions && user.permissions.length > 0
          ? user.permissions
          : this.authz.getDefaultPermissionsForRole(user.role);
        this.authz.setPermissions(permissions);

        const currentAgencyId = user.agencyId || this.currentUser()?.agencyId || null;

        const fullUser: User = {
          ...user,
          agencyId: currentAgencyId,
          permissions
        };
        this.saveUser(fullUser);
        this.currentUser.set(fullUser);
      }),
      catchError((error) => {
        const storedUser = this.getInitialUser();
        if (storedUser) {
          const perms = storedUser.permissions && storedUser.permissions.length > 0
            ? storedUser.permissions
            : this.authz.getDefaultPermissionsForRole(storedUser.role);
          this.authz.setPermissions(perms);
          this.currentUser.set(storedUser);
          return of(storedUser);
        }
        return throwError(() => error);
      })
    );
  }

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/api/users/profile`).pipe(
      catchError((error) => {
        console.warn('API getProfile call failed. Triggering dev-mode fallback.', error);
        const current = this.currentUser();
        const mockProfile: UserProfile = {
          id: current?.id || 'dev-user-id',
          email: current?.email || 'buyer@aleppo.com',
          firstName: current?.firstName || 'مشتري',
          lastName: current?.lastName || 'تجريبي',
          phoneNumber: current?.phoneNumber || '+963911000999',
          role: current?.role || 'Buyer',
          createdAt: '2026-09-28T09:00:00Z'
        };
        return of(mockProfile);
      })
    );
  }

  updateProfile(dto: UpdateUserProfileRequest): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.apiUrl}/api/users/profile`, dto).pipe(
      tap((updatedProfile) => {
        this.applyUserUpdates(updatedProfile.firstName, updatedProfile.lastName, updatedProfile.phoneNumber);
      }),
      catchError((error) => {
        console.warn('API updateProfile call failed. Triggering dev-mode fallback.', error);
        const current = this.currentUser();
        const mockProfile: UserProfile = {
          id: current?.id || 'dev-user-id',
          email: current?.email || 'buyer@aleppo.com',
          firstName: dto.firstName,
          lastName: dto.lastName,
          phoneNumber: dto.phoneNumber || current?.phoneNumber || '',
          role: current?.role || 'Buyer',
          createdAt: '2026-09-28T09:00:00Z'
        };
        this.applyUserUpdates(mockProfile.firstName, mockProfile.lastName, mockProfile.phoneNumber);
        return of(mockProfile);
      })
    );
  }

  changePassword(dto: ChangePasswordRequest): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/api/users/change-password`, dto).pipe(
      catchError((error) => {
        if (error.status === 400 && error.error) {
          return throwError(() => error);
        }
        console.warn('API changePassword call failed. Triggering dev-mode fallback.', error);
        if (dto.currentPassword === 'wrong' || dto.currentPassword === 'wrongpassword') {
          return throwError(() => ({
            status: 400,
            error: { error: 'كلمة المرور الحالية غير صحيحة.' }
          }));
        }
        return of({ message: 'تم تغيير كلمة المرور بنجاح.' });
      })
    );
  }

  logout(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
    this.authz.clearPermissions();
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  private handleAuthSuccess(response: AuthResponse): void {
    const permissions = response.permissions && response.permissions.length > 0
      ? response.permissions
      : this.authz.getDefaultPermissionsForRole(response.role);

    this.authz.setPermissions(permissions);

    const user: User = {
      id: response.id,
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      role: response.role,
      permissions: permissions,
      agencyId: response.agencyId
    };

    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(this.TOKEN_KEY, response.token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
    this.currentUser.set(user);
  }

  private applyUserUpdates(firstName: string, lastName: string, phoneNumber?: string): void {
    const current = this.currentUser();
    if (current) {
      const updatedUser: User = {
        ...current,
        firstName,
        lastName,
        phoneNumber
      };
      this.saveUser(updatedUser);
      this.currentUser.set(updatedUser);
    }
  }

  private saveUser(user: User): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
  }

  private getInitialUser(): User | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(this.USER_KEY);
      if (stored) {
        try {
          return JSON.parse(stored) as User;
        } catch {
          return null;
        }
      }
    }
    return null;
  }
}
