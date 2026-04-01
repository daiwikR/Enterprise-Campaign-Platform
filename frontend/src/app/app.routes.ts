import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const APP_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'campaigns',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadChildren: () =>
      import('./features/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'campaigns',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/campaigns/campaigns.module').then(m => m.CampaignsModule)
  },
  {
    path: '**',
    redirectTo: 'campaigns'
  }
];
