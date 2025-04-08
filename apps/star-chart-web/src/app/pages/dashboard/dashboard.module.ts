import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './dashboard.component';
import { UserStateModule } from '../../components/user-state/user-state.module';
import { UserGraphModule } from '../../components/user-graph/user-graph.module';
import { RouterModule } from '@angular/router';
import { StreamStatusIndicatorModule } from '../../components/stream-status-indicator/stream-status-indicator.module';

// Angular Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

@NgModule({
  declarations: [DashboardComponent],
  imports: [
    // Angular Core Modules
    CommonModule,
    RouterModule,
    
    // Material Modules
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatProgressBarModule,
    MatDividerModule,
    MatTooltipModule,
    
    // Custom Modules
    UserStateModule,
    UserGraphModule,
    StreamStatusIndicatorModule // Add the new module
  ],
  exports: [DashboardComponent]
})
export class DashboardModule {}
