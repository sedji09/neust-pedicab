import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'student',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
    data: { role: 'student' },
  },
  {
    path: 'driver',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
    data: { role: 'driver' },
  },
  {
    path: 'admin',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
    data: { role: 'admin' },
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];
