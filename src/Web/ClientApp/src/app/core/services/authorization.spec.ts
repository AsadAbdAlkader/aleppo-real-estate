import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthorizationService } from './authorization.service';
import { AuthService } from './auth.service';
import { HasPermissionDirective } from '../directives/has-permission.directive';
import { permissionGuard } from '../guards/permission.guard';
import { Permissions } from '../auth/permissions';

@Component({
  standalone: true,
  imports: [HasPermissionDirective],
  template: `
    <button id="add-btn" *appHasPermission="testPermission">إضافة عقار</button>
    <div id="multi-btn" *appHasPermission="['Property.Edit', 'Property.Approve']; requireAll: true">
      مراجعة واعتماد
    </div>
  `
})
class TestHostComponent {
  testPermission = Permissions.Property.Create;
}

describe('Enterprise Authorization Architecture', () => {
  let authzService: AuthorizationService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [AuthorizationService]
    });
    authzService = TestBed.inject(AuthorizationService);
  });

  describe('AuthorizationService', () => {
    it('should initialize with empty permissions when localStorage is empty', () => {
      expect(authzService.permissions().size).toBe(0);
      expect(authzService.hasPermission(Permissions.Property.Create)).toBe(false);
    });

    it('should return true for hasPermission when permission is present', () => {
      authzService.setPermissions([Permissions.Property.View, Permissions.Property.Create]);

      expect(authzService.hasPermission(Permissions.Property.Create)).toBe(true);
      expect(authzService.hasPermission(Permissions.Property.View)).toBe(true);
      expect(authzService.hasPermission(Permissions.Property.Delete)).toBe(false);
    });

    it('should support OR logic with canAccess by default', () => {
      authzService.setPermissions([Permissions.Property.View]);

      expect(authzService.canAccess([Permissions.Property.View, Permissions.Property.Create])).toBe(true);
      expect(authzService.canAccess([Permissions.Property.Create, Permissions.Property.Delete])).toBe(false);
    });

    it('should support AND logic with canAccess when requireAll is true', () => {
      authzService.setPermissions([Permissions.Property.View, Permissions.Property.Create]);

      expect(authzService.canAccess([Permissions.Property.View, Permissions.Property.Create], true)).toBe(true);
      expect(authzService.canAccess([Permissions.Property.View, Permissions.Property.Delete], true)).toBe(false);
    });

    it('should clear permissions and remove from localStorage', () => {
      authzService.setPermissions([Permissions.Property.View]);
      expect(authzService.permissions().size).toBe(1);

      authzService.clearPermissions();
      expect(authzService.permissions().size).toBe(0);
      expect(localStorage.getItem('aleppo_permissions')).toBeNull();
    });

    it('should generate correct default permissions for Admin vs Agent vs Buyer', () => {
      const adminPerms = authzService.getDefaultPermissionsForRole('Admin');
      const agentPerms = authzService.getDefaultPermissionsForRole('Agent');
      const buyerPerms = authzService.getDefaultPermissionsForRole('Buyer');

      expect(adminPerms).toContain(Permissions.Property.GlobalAccess);
      expect(adminPerms).toContain(Permissions.Property.Approve);

      // Agent does not have Approve
      expect(agentPerms).not.toContain(Permissions.Property.Approve);
      expect(agentPerms).toContain(Permissions.Property.Create);

      // Buyer does not have Create or Edit
      expect(buyerPerms).not.toContain(Permissions.Property.Create);
      expect(buyerPerms).toContain(Permissions.Property.View);
    });
  });

  describe('HasPermissionDirective', () => {
    it('should render element when user has required permission', () => {
      authzService.setPermissions([Permissions.Property.Create]);

      const fixture = TestBed.createComponent(TestHostComponent);
      fixture.detectChanges();

      const btn = fixture.nativeElement.querySelector('#add-btn');
      expect(btn).not.toBeNull();
      expect(btn.textContent).toContain('إضافة عقار');
    });

    it('should hide element when user lacks required permission', () => {
      authzService.setPermissions([Permissions.Property.View]); // Missing Create

      const fixture = TestBed.createComponent(TestHostComponent);
      fixture.detectChanges();

      const btn = fixture.nativeElement.querySelector('#add-btn');
      expect(btn).toBeNull();
    });

    it('should enforce requireAll (AND logic) on multi-permission check', () => {
      // Has Edit but not Approve
      authzService.setPermissions([Permissions.Property.Edit]);

      const fixture = TestBed.createComponent(TestHostComponent);
      fixture.detectChanges();

      const multi = fixture.nativeElement.querySelector('#multi-btn');
      expect(multi).toBeNull();

      // Now grant Approve as well
      authzService.setPermissions([Permissions.Property.Edit, Permissions.Property.Approve]);
      fixture.detectChanges();

      const multiAfter = fixture.nativeElement.querySelector('#multi-btn');
      expect(multiAfter).not.toBeNull();
      expect(multiAfter.textContent).toContain('مراجعة واعتماد');
    });
  });

  describe('permissionGuard', () => {
    it('should allow access when authenticated and authorized', () => {
      const mockAuthService = {
        isAuthenticated: () => true
      };
      authzService.setPermissions([Permissions.Property.Create]);

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          { provide: AuthService, useValue: mockAuthService },
          { provide: AuthorizationService, useValue: authzService },
          { provide: Router, useValue: { createUrlTree: (url: string[]) => url } }
        ]
      });

      const guard = permissionGuard(Permissions.Property.Create);
      const result = TestBed.runInInjectionContext(() =>
        guard({} as any, { url: '/my-properties' } as any)
      );

      expect(result).toBe(true);
    });

    it('should redirect to login when user is unauthenticated', () => {
      const mockAuthService = {
        isAuthenticated: () => false
      };
      const mockRouter = {
        createUrlTree: vi.fn((commands: any[], extras: any) => ({ commands, extras }))
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          { provide: AuthService, useValue: mockAuthService },
          { provide: AuthorizationService, useValue: authzService },
          { provide: Router, useValue: mockRouter }
        ]
      });

      const guard = permissionGuard(Permissions.Property.Create);
      TestBed.runInInjectionContext(() =>
        guard({} as any, { url: '/my-properties' } as any)
      );

      expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/login'], {
        queryParams: { returnUrl: '/my-properties' }
      });
    });

    it('should redirect to home when authenticated but lacking permission', () => {
      const mockAuthService = {
        isAuthenticated: () => true
      };
      authzService.setPermissions([Permissions.Property.View]); // Missing Create
      const mockRouter = {
        createUrlTree: vi.fn((commands: any[]) => commands)
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          { provide: AuthService, useValue: mockAuthService },
          { provide: AuthorizationService, useValue: authzService },
          { provide: Router, useValue: mockRouter }
        ]
      });

      const guard = permissionGuard(Permissions.Property.Create);
      TestBed.runInInjectionContext(() =>
        guard({} as any, { url: '/my-properties' } as any)
      );

      expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/']);
    });
  });
});
