import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConnectionIndicatorComponent } from './connection-indicator.component';

@NgModule({
  declarations: [ConnectionIndicatorComponent],
  imports: [CommonModule],
  exports: [ConnectionIndicatorComponent]
})
export class ConnectionIndicatorModule {}
