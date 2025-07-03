import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./modules/auth/auth.routes').then(r => r.authRoutes)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./modules/dashboard/dashboard.component').then(c => c.DashboardComponent)
  },
  {
    path: 'collaborators',
    loadComponent: () => import('./modules/collaborators/collaborators.component').then(c => c.CollaboratorsComponent)
  },
  {
    path: 'activities',
    loadComponent: () => import('./modules/activities/activities.component').then(c => c.ActivitiesComponent)
  },
  {
    path: 'settings',
    loadComponent: () => import('./modules/settings/settings.component').then(c => c.SettingsComponent)
  },
];
