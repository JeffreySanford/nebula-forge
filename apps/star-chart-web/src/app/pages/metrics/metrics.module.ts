import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MetricsComponent } from './metrics.component';
import { RouterModule, Routes } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MetricsTileModule } from '../../components/metrics-tile/metrics-tile.module';

const routes: Routes = [
  {
    path: '',
    component: MetricsComponent
  }
];

@NgModule({
  declarations: [MetricsComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatCardModule,
    MetricsTileModule
  ]
})
export class MetricsModule {}
