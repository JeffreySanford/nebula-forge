import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard'
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./pages/dashboard/dashboard.module').then(m => m.DashboardModule)
  },
  {
    path: 'metrics',
    loadChildren: () => import('./pages/metrics/metrics.module').then(m => m.MetricsModule)
  },
  {
    path: 'performance',
    loadChildren: () => import('./pages/performance/performance.module').then(m => m.PerformanceModule)
  },
  {
    path: 'logs',
    loadChildren: () => import('./pages/logs/logs.module').then(m => m.LogsModule)
  },
  {
    path: 'database',
    loadChildren: () => import('./pages/database/database.module').then(m => m.DatabaseModule)
  },
  {
    path: 'graphql',
    loadChildren: () => import('./pages/graphql/graphql.module').then(m => m.GraphqlModule)
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { 
    initialNavigation: 'enabledBlocking',
    useHash: false,
    enableTracing: false
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
