import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AuthorizationService } from '../services/authorization.service';

/**
 * Functional Route Guard enforcing fine-grained functional permissions.
 * Example:
 *  {
 *    path: 'manage/agencies',
 *    component: AgencyManagementComponent,
 *    canActivate: [authGuard, permissionGuard(Permissions.Agency.View)]
 *  }
 */
export function permissionGuard(
  requiredPermissions: string | string[],
  requireAll = false
): CanActivateFn {
  return (route, state) => {
    const authService = inject(AuthService);
    const authzService = inject(AuthorizationService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      return router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url }
      });
    }

    if (authzService.canAccess(requiredPermissions, requireAll)) {
      return true;
    }

    console.warn(
      `Access denied: Missing required permission(s) '${JSON.stringify(requiredPermissions)}' for route '${state.url}'.`
    );

    // Redirect unauthorized authenticated users to home
    return router.createUrlTree(['/']);
  };
}
