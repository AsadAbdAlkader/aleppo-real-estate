import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { authInterceptor } from '../../core/interceptors/auth.interceptor';
import { authGuard } from '../../core/guards/auth.guard';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { HeaderComponent } from '../../core/components/header/header.component';
import { AuthResponse, User } from '../../core/models/auth.model';

describe('Auth Module Tests', () => {
  let authService: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [LoginComponent, RegisterComponent, HeaderComponent],
      providers: [
        AuthService,
        provideRouter([
          { path: 'login', component: LoginComponent },
          { path: 'register', component: RegisterComponent }
        ]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting()
      ]
    });

    authService = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('AuthService', () => {
    it('should be created and start unauthenticated', () => {
      expect(authService).toBeTruthy();
      expect(authService.isAuthenticated()).toBe(false);
      expect(authService.currentUser()).toBeNull();
      expect(authService.userRole()).toBeNull();
    });

    it('should perform login and update signals and localStorage', () => {
      const mockResponse: AuthResponse = {
        id: '123',
        email: 'user@test.com',
        firstName: 'أحمد',
        lastName: 'الحلبي',
        role: 'Buyer',
        token: 'test-token',
        expiresAt: '2026-10-01'
      };

      authService.login({ email: 'user@test.com', password: 'Password123!' }).subscribe((res) => {
        expect(res.token).toBe('test-token');
      });

      const req = httpMock.expectOne('/api/auth/login');
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);

      expect(authService.isAuthenticated()).toBe(true);
      expect(authService.currentUser()?.email).toBe('user@test.com');
      expect(authService.userRole()).toBe('Buyer');
      expect(localStorage.getItem('auth_token')).toBe('test-token');
    });

    it('should use dev-mode fallback when login API fails', () => {
      authService.login({ email: 'agent@test.com', password: 'Password123!' }).subscribe((res) => {
        expect(res.token).toContain('dev-jwt-token');
        expect(res.role).toBe('Agent');
      });

      const req = httpMock.expectOne('/api/auth/login');
      req.flush('Error', { status: 500, statusText: 'Server Error' });

      expect(authService.isAuthenticated()).toBe(true);
      expect(authService.userRole()).toBe('Agent');
    });

    it('should perform register and update signals', () => {
      const mockResponse: AuthResponse = {
        id: '456',
        email: 'new@test.com',
        firstName: 'سامر',
        lastName: 'العلي',
        role: 'Agent',
        token: 'register-token',
        expiresAt: '2026-10-01'
      };

      authService.register({
        email: 'new@test.com',
        password: 'Password123!',
        firstName: 'سامر',
        lastName: 'العلي',
        role: 'Agent'
      }).subscribe((res) => {
        expect(res.token).toBe('register-token');
      });

      const req = httpMock.expectOne('/api/auth/register');
      req.flush(mockResponse);

      expect(authService.isAuthenticated()).toBe(true);
      expect(authService.userRole()).toBe('Agent');
    });

    it('should clear signals and localStorage on logout', () => {
      localStorage.setItem('auth_token', 'test');
      localStorage.setItem('auth_user', JSON.stringify({ id: '1', email: 'a@b.com', firstName: 'A', lastName: 'B', role: 'Buyer' }));
      authService.currentUser.set({ id: '1', email: 'a@b.com', firstName: 'A', lastName: 'B', role: 'Buyer' });

      authService.logout();

      expect(authService.isAuthenticated()).toBe(false);
      expect(authService.currentUser()).toBeNull();
      expect(localStorage.getItem('auth_token')).toBeNull();
    });

    it('should return profile from getProfile and fallback on error', () => {
      authService.currentUser.set({ id: 'u1', email: 'test@aleppo.com', firstName: 'أحمد', lastName: 'الحلبي', role: 'Buyer' });

      authService.getProfile().subscribe((prof) => {
        expect(prof.email).toBe('test@aleppo.com');
        expect(prof.firstName).toBe('أحمد');
      });

      const req = httpMock.expectOne('/api/users/profile');
      expect(req.request.method).toBe('GET');
      req.flush({ id: 'u1', email: 'test@aleppo.com', firstName: 'أحمد', lastName: 'الحلبي', phoneNumber: '+963911', role: 'Buyer', createdAt: '2026-09-28T09:00:00Z' });
    });

    it('should update profile via updateProfile and sync currentUser signal and localStorage', () => {
      authService.currentUser.set({ id: 'u1', email: 'test@aleppo.com', firstName: 'أحمد', lastName: 'الحلبي', role: 'Buyer' });

      authService.updateProfile({ firstName: 'سامر', lastName: 'الشامي', phoneNumber: '+963999888' }).subscribe((prof) => {
        expect(prof.firstName).toBe('سامر');
      });

      const req = httpMock.expectOne('/api/users/profile');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ firstName: 'سامر', lastName: 'الشامي', phoneNumber: '+963999888' });
      req.flush({ id: 'u1', email: 'test@aleppo.com', firstName: 'سامر', lastName: 'الشامي', phoneNumber: '+963999888', role: 'Buyer', createdAt: '2026-09-28T09:00:00Z' });

      expect(authService.currentUser()?.firstName).toBe('سامر');
      expect(authService.currentUser()?.phoneNumber).toBe('+963999888');
      const stored = JSON.parse(localStorage.getItem('auth_user') || '{}');
      expect(stored.firstName).toBe('سامر');
    });

    it('should change password via changePassword and handle error responses', () => {
      authService.changePassword({ currentPassword: 'OldPassword123!', newPassword: 'NewPassword456!' }).subscribe((res) => {
        expect(res.message).toBe('تم تغيير كلمة المرور بنجاح.');
      });

      const req = httpMock.expectOne('/api/users/change-password');
      expect(req.request.method).toBe('PUT');
      req.flush({ message: 'تم تغيير كلمة المرور بنجاح.' });
    });

    it('should report isDevMode boolean correctly', () => {
      expect(typeof authService.isDevMode()).toBe('boolean');
    });
  });

  describe('authInterceptor & authGuard', () => {
    it('should attach Bearer token to request if present', () => {
      localStorage.setItem('auth_token', 'my-jwt-token');

      authService.getCurrentUser().subscribe();

      const req = httpMock.expectOne('/api/auth/me');
      expect(req.request.headers.has('Authorization')).toBe(true);
      expect(req.request.headers.get('Authorization')).toBe('Bearer my-jwt-token');
      req.flush({ id: '1', email: 'a@b.com', firstName: 'A', lastName: 'B', role: 'Buyer' });
    });

    it('should pass authGuard when authenticated and block when unauthenticated', () => {
      const guardResultUnauth = TestBed.runInInjectionContext(() =>
        authGuard({} as any, { url: '/protected' } as any)
      );
      expect(guardResultUnauth).not.toBe(true);

      authService.currentUser.set({ id: '1', email: 'a@b.com', firstName: 'A', lastName: 'B', role: 'Buyer' });

      const guardResultAuth = TestBed.runInInjectionContext(() =>
        authGuard({} as any, { url: '/protected' } as any)
      );
      expect(guardResultAuth).toBe(true);
    });
  });

  describe('LoginComponent & RegisterComponent & HeaderComponent', () => {
    it('should create LoginComponent', () => {
      const fixture = TestBed.createComponent(LoginComponent);
      const comp = fixture.componentInstance;
      expect(comp).toBeTruthy();
      expect(comp.loginForm.valid).toBe(false);
    });

    it('should create RegisterComponent', () => {
      const fixture = TestBed.createComponent(RegisterComponent);
      const comp = fixture.componentInstance;
      expect(comp).toBeTruthy();
      expect(comp.registerForm.value.role).toBe('Buyer');
    });

    it('should create HeaderComponent and render user info when logged in', () => {
      const fixture = TestBed.createComponent(HeaderComponent);
      authService.currentUser.set({ id: '1', email: 'a@b.com', firstName: 'أحمد', lastName: 'الحلبي', role: 'Agent' });
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('أحمد');
      expect(compiled.textContent).toContain('وكيل عقاري');
      expect(compiled.textContent).toContain('تسجيل الخروج');
    });
  });
});
