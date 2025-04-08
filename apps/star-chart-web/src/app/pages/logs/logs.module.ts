import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogsComponent } from './logs.component';
import { RouterModule, Routes } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { LogViewerModule } from '../../components/log-viewer/log-viewer.module';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

const routes: Routes = [
  {
    path: '',
    component: LogsComponent
  }
];

@NgModule({
  declarations: [LogsComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatCardModule,
    LogViewerModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ]
})
export class LogsModule {}
