import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  effect,
  inject
} from '@angular/core';
import { AuthorizationService } from '../services/authorization.service';

/**
 * Structural Directive to conditionally render DOM elements based on functional permissions.
 * Example usages:
 *  <button *appHasPermission="permissions.Property.Create">إضافة عقار</button>
 *  <div *appHasPermission="['Property.Edit', 'Property.Approve']" [appHasPermissionRequireAll]="true">...</div>
 */
@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly authz = inject(AuthorizationService);

  private requiredPermissions: string | string[] = [];
  private requireAll = false;
  private hasView = false;

  @Input('appHasPermission')
  set appHasPermission(val: string | string[]) {
    this.requiredPermissions = val;
    this.updateView();
  }

  @Input('appHasPermissionRequireAll')
  set appHasPermissionRequireAll(val: boolean) {
    this.requireAll = val;
    this.updateView();
  }

  constructor() {
    // React to signal updates in AuthorizationService
    effect(() => {
      // Register dependency on permissions signal
      this.authz.permissions();
      this.updateView();
    });
  }

  private updateView(): void {
    const isAuthorized = this.authz.canAccess(this.requiredPermissions, this.requireAll);

    if (isAuthorized && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!isAuthorized && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
