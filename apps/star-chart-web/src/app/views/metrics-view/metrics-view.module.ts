import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MetricsViewComponent } from './metrics-view.component';

// Material imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

// Import the StreamStatusIndicatorModule
import { StreamStatusIndicatorModule } from '../../components/stream-status-indicator/stream-status-indicator.module';

@NgModule({
  declarations: [MetricsViewComponent],
  imports: [
    CommonModule,
    RouterModule.forChild([{ path: '', component: MetricsViewComponent }]),
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatDividerModule,
    StreamStatusIndicatorModule // Add the module here
  ]
})
export class MetricsViewModule { }
