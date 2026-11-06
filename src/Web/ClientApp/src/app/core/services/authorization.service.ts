import { Injectable, signal, computed } from '@angular/core';
import { Permissions } from '../auth/permissions';

@Injectable({
  providedIn: 'root'
})
export class AuthorizationService {
  private readonly STORAGE_KEY = 'aleppo_permissions';

  // O(1) Signal-based permissions state
  readonly permissions = signal<ReadonlySet<string>>(this.loadInitialPermissions());

  readonly permissionsList = computed(() => Array.from(this.permissions()));

  /**
   * Check if user possesses a specific functional permission in O(1) time
   */
  hasPermission(permission: string): boolean {
    if (!permission) return false;
    return this.permissions().has(permission);
  }

  /**
   * Check if user satisfies one or all required permissions
   * @param perms Single permission or array of permissions
   * @param requireAll True for AND logic, false for OR logic (default false)
   */
  canAccess(perms: string | string[], requireAll = false): boolean {
    if (!perms || (Array.isArray(perms) && perms.length === 0)) {
      return true;
    }

    const current = this.permissions();
    const permArray = Array.isArray(perms) ? perms : [perms];

    if (requireAll) {
      return permArray.every((p) => current.has(p));
    }

    return permArray.some((p) => current.has(p));
  }

  /**
   * Set user permissions and persist to localStorage
   */
  setPermissions(newPermissions: string[]): void {
    const permSet = new Set<string>(newPermissions);
    this.permissions.set(permSet);

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newPermissions));
      } catch (err) {
        console.error('Failed to persist permissions to localStorage:', err);
      }
    }
  }

  /**
   * Clear all permissions on logout
   */
  clearPermissions(): void {
    this.permissions.set(new Set<string>());
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  /**
   * Fallback role-to-permissions mapping matching DefaultRolePermissions on the backend
   */
  getDefaultPermissionsForRole(role: string): string[] {
    const normalized = role?.toLowerCase() || '';

    if (normalized === 'admin') {
      return [
        Permissions.Property.View,
        Permissions.Property.Create,
        Permissions.Property.Edit,
        Permissions.Property.Delete,
        Permissions.Property.Approve,
        Permissions.Property.Feature,
        Permissions.Property.GlobalAccess,
        Permissions.Inquiry.View,
        Permissions.Inquiry.Respond,
        Permissions.Inquiry.Manage,
        Permissions.Agency.View,
        Permissions.Agency.Create,
        Permissions.Agency.Edit,
        Permissions.Agency.Delete,
        Permissions.Agency.ManageAgents,
        Permissions.User.View,
        Permissions.User.Manage,
        Permissions.User.AssignRole,
        Permissions.Chat.Access,
        Permissions.Chat.Send,
        Permissions.Dashboard.ViewGlobal,
        Permissions.Dashboard.ViewAgency
      ];
    }

    if (normalized === 'agencymanager') {
      return [
        Permissions.Property.View,
        Permissions.Property.Create,
        Permissions.Property.Edit,
        Permissions.Property.Delete,
        Permissions.Property.Approve,
        Permissions.Property.Feature,
        Permissions.Inquiry.View,
        Permissions.Inquiry.Respond,
        Permissions.Inquiry.Manage,
        Permissions.Agency.View,
        Permissions.Agency.ManageAgents,
        Permissions.Chat.Access,
        Permissions.Chat.Send,
        Permissions.Dashboard.ViewAgency
      ];
    }

    if (normalized === 'agent') {
      return [
        Permissions.Property.View,
        Permissions.Property.Create,
        Permissions.Property.Edit,
        Permissions.Property.Delete,
        Permissions.Inquiry.View,
        Permissions.Inquiry.Respond,
        Permissions.Agency.View,
        Permissions.Chat.Access,
        Permissions.Chat.Send
      ];
    }

    if (normalized === 'owner') {
      return [
        Permissions.Property.View,
        Permissions.Property.Create,
        Permissions.Property.Edit,
        Permissions.Property.Delete,
        Permissions.Inquiry.View,
        Permissions.Inquiry.Respond,
        Permissions.Chat.Access,
        Permissions.Chat.Send
      ];
    }

    // Default Buyer
    return [
      Permissions.Property.View,
      Permissions.Inquiry.View,
      Permissions.Inquiry.Create,
      Permissions.Chat.Access,
      Permissions.Chat.Send
    ];
  }

  private loadInitialPermissions(): ReadonlySet<string> {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            return new Set<string>(parsed);
          }
        }
      } catch (err) {
        console.warn('Failed to parse cached permissions from localStorage:', err);
      }
    }
    return new Set<string>();
  }
}
