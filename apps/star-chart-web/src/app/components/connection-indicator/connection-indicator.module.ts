import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { ConnectionIndicatorComponent } from './connection-indicator.component';

@NgModule({
  declarations: [ConnectionIndicatorComponent],
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  exports: [ConnectionIndicatorComponent]
})
export class ConnectionIndicatorModule {}
