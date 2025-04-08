import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LogsComponent } from './pages/logs/logs.component';
import { GraphqlComponent } from './pages/graphql/graphql.component';
import { DatabaseComponent } from './pages/database/database.component';
import { PerformanceComponent } from './pages/performance/performance.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { 
    path: 'metrics', 
    loadChildren: () => import('./views/metrics-view/metrics-view.module')
      .then(m => m.MetricsViewModule) 
  },
  { path: 'logs', component: LogsComponent },
  { path: 'graphql', component: GraphqlComponent },
  { path: 'database', component: DatabaseComponent },
  { path: 'performance', component: PerformanceComponent },
  { path: '**', component: NotFoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { enableTracing: false })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
