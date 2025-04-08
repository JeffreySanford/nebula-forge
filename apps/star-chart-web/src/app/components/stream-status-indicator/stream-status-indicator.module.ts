import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StreamStatusIndicatorComponent } from './stream-status-indicator.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  declarations: [StreamStatusIndicatorComponent],
  imports: [
    CommonModule,
    MatTooltipModule,
    MatIconModule
  ],
  exports: [StreamStatusIndicatorComponent]
})
export class StreamStatusIndicatorModule {}
