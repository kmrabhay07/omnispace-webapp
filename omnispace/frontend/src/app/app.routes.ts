import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
  { path: 'properties', loadComponent: () => import('./pages/properties/property-list/property-list.component').then(m => m.PropertyListComponent) },
  { path: 'properties/new', canActivate: [authGuard], loadComponent: () => import('./pages/properties/property-form/property-form.component').then(m => m.PropertyFormComponent) },
  { path: 'properties/:id/edit', canActivate: [authGuard], loadComponent: () => import('./pages/properties/property-form/property-form.component').then(m => m.PropertyFormComponent) },
  { path: 'properties/:id', loadComponent: () => import('./pages/properties/property-detail/property-detail.component').then(m => m.PropertyDetailComponent) },
  { path: 'my-properties', canActivate: [authGuard], loadComponent: () => import('./pages/properties/my-properties.component').then(m => m.MyPropertiesComponent) },
  { path: 'designs', canActivate: [authGuard], loadComponent: () => import('./pages/designer/design-gallery.component').then(m => m.DesignGalleryComponent) },
  { path: 'designer', canActivate: [authGuard], canDeactivate: [(component: { canLeave: () => boolean }) => component.canLeave()], loadComponent: () => import('./pages/designer/designer.component').then(m => m.DesignerComponent) },
  { path: 'chats', canActivate: [authGuard], loadComponent: () => import('./pages/chats/chats.component').then(m => m.ChatsComponent) },
  { path: 'login', loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./pages/auth/register/register.component').then(m => m.RegisterComponent) },
  { path: '**', redirectTo: '' }
];
