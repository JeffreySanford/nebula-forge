import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MetricsTileComponent } from './metrics-tile.component';

@NgModule({
  declarations: [MetricsTileComponent],
  imports: [
    CommonModule,
    MatCardModule
  ],
  exports: [MetricsTileComponent]
})
export class MetricsTileModule {}
