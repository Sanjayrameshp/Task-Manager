import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterAdminComponent } from './components/register-admin/register-admin.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { UserDetailsComponent } from './components/user-details/user-details.component';
import { authGuard } from './services/auth.guard';

export const routes: Routes = [
    {path: '', component: LoginComponent, canActivate: [authGuard]},
    {path: 'login', component: LoginComponent},
    {path: 'register-admin', component: RegisterAdminComponent},
    {path: 'dashboard', component: AdminDashboardComponent, canActivate: [authGuard]},
    {path: 'user-details/:uid', component: UserDetailsComponent, canActivate: [authGuard]}
];
