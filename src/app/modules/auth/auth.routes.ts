import { Routes } from '@angular/router';

export const authRoutes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./views/login/login.component').then(c => c.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./views/register/register.component').then(c => c.RegisterComponent)
  },
  {
    path: 'lock',
    loadComponent: () => import('./views/lock/lock.component').then(c => c.LockComponent)
  }
]; 