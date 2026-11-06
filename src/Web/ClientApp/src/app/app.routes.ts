import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';
import { Permissions } from './core/auth/permissions';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent) },
  { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent), canActivate: [authGuard] },
  { path: 'profile', loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent), canActivate: [authGuard] },
  { path: 'messages', loadComponent: () => import('./features/chat/chat.component').then(m => m.ChatComponent), canActivate: [authGuard] },
  { path: 'properties', loadComponent: () => import('./features/properties/property-list/property-list.component').then(m => m.PropertyListComponent) },
  { path: 'properties/:id', loadComponent: () => import('./features/properties/property-detail.component').then(m => m.PropertyDetailComponent) },
  { path: 'agents', loadComponent: () => import('./features/agents/agent-list.component').then(m => m.AgentListComponent) },
  { path: 'agents/:id', loadComponent: () => import('./features/agents/agent-detail.component').then(m => m.AgentDetailComponent) },
  { path: 'my-properties', loadComponent: () => import('./features/properties/my-properties.component').then(m => m.MyPropertiesComponent), canActivate: [authGuard, permissionGuard(Permissions.Property.Create)] },
  { path: 'my-property-inquiries', loadComponent: () => import('./features/inquiries/received-inquiries.component').then(m => m.ReceivedInquiriesComponent), canActivate: [authGuard, permissionGuard(Permissions.Inquiry.Respond)] },
  { path: 'favorites', loadComponent: () => import('./features/favorites/favorites.component').then(m => m.FavoritesComponent), canActivate: [authGuard] },
  { path: 'inquiries', loadComponent: () => import('./features/inquiries/my-inquiries.component').then(m => m.MyInquiriesComponent), canActivate: [authGuard] },
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent) },
  { path: '**', redirectTo: '' }
];
