import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { PerformanceTileComponent } from './performance-tile.component';

@NgModule({
  declarations: [PerformanceTileComponent],
  imports: [
    CommonModule,
    MatCardModule
  ],
  exports: [PerformanceTileComponent]
})
export class PerformanceTileModule {}
