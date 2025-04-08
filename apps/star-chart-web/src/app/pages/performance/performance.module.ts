import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PerformanceComponent } from './performance.component';
import { RouterModule, Routes } from '@angular/router';
import { PerformanceTileModule } from '../../components/performance-tile/performance-tile.module';

// Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

const routes: Routes = [
  {
    path: '',
    component: PerformanceComponent
  }
];

@NgModule({
  declarations: [PerformanceComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatCardModule,
    MatIconModule,
    MatTooltipModule,
    PerformanceTileModule
  ]
})
export class PerformanceModule {}
