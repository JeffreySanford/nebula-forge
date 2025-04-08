import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogsComponent } from './logs.component';
import { MatCardModule } from '@angular/material/card';
import { LogViewerModule } from '../../components/log-viewer/log-viewer.module';
import { MatButtonModule } from '@angular/material/button'; // Import MatButtonModule
import { MatIconModule } from '@angular/material/icon'; // Import MatIconModule

@NgModule({
  declarations: [LogsComponent],
  imports: [
    CommonModule,
    MatCardModule,
    LogViewerModule,
    MatButtonModule, // Add MatButtonModule
    MatIconModule    // Add MatIconModule
  ],
  exports: [LogsComponent]
})
export class LogsModule {}
