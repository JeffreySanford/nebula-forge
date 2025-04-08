import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MetricsComponent } from './metrics.component';
import { MatCardModule } from '@angular/material/card';
import { MetricsTileModule } from '../../components/metrics-tile/metrics-tile.module';

@NgModule({
  declarations: [MetricsComponent],
  imports: [
    CommonModule,
    MatCardModule,
    MetricsTileModule
  ],
  exports: [MetricsComponent]
})
export class MetricsModule {}
