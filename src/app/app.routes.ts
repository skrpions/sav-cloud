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
    path: 'farms',
    loadComponent: () => import('./modules/farms/farms.component').then(c => c.FarmsComponent)
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
    path: 'harvest',
    loadComponent: () => import('./modules/harvest/harvest.component').then(c => c.HarvestComponent)
  },
  {
    path: 'settings',
    loadComponent: () => import('./modules/settings/settings.component').then(c => c.SettingsComponent)
  },
  {
    path: 'purchases',
    loadComponent: () => import('./modules/purchases/purchases.component').then(c => c.PurchasesComponent)
  },
  {
    path: 'sales',
    loadComponent: () => import('./modules/sales/sales.component').then(c => c.SalesComponent)
  },
  {
    path: 'reports',
    loadComponent: () => import('./modules/reports/reports.component').then(c => c.ReportsComponent)
  },
];
