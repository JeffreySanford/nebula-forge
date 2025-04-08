import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './dashboard.component';
import { UserStateModule } from '../../components/user-state/user-state.module';
import { UserGraphModule } from '../../components/user-graph/user-graph.module';
import { RouterModule } from '@angular/router';

// Angular Material Imports - Fix the imports
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs'; // Changed from MatTabModule to MatTabsModule
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';

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
    
    // Custom Modules
    UserStateModule,
    UserGraphModule
  ],
  exports: [DashboardComponent]
})
export class DashboardModule {}
