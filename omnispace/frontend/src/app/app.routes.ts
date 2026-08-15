import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { PropertyListComponent } from './pages/properties/property-list/property-list.component';
import { PropertyDetailComponent } from './pages/properties/property-detail/property-detail.component';
import { PropertyFormComponent } from './pages/properties/property-form/property-form.component';
import { DesignerComponent } from './pages/designer/designer.component';
import { LoginComponent } from './pages/auth/login/login.component';
import { RegisterComponent } from './pages/auth/register/register.component';
import { ChatsComponent } from './pages/chats/chats.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'properties', component: PropertyListComponent },
  { path: 'properties/new', component: PropertyFormComponent, canActivate: [authGuard] },
  { path: 'properties/:id', component: PropertyDetailComponent },
  { path: 'designer', component: DesignerComponent },
  { path: 'chats', component: ChatsComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: '**', redirectTo: '' }
];
