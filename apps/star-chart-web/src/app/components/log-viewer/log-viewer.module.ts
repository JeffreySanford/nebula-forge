import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LogViewerComponent } from './log-viewer.component';
import { DirectivesModule } from '../../directives/directives.module';

@NgModule({
  declarations: [LogViewerComponent],
  imports: [
    CommonModule,
    FormsModule,
    DirectivesModule
  ],
  exports: [LogViewerComponent]
})
export class LogViewerModule {}
