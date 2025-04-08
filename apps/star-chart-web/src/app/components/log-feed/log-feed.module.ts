import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { LogFeedComponent } from './log-feed.component';
import { DirectivesModule } from '../../directives/directives.module';

@NgModule({
  declarations: [LogFeedComponent],
  imports: [
    CommonModule,
    MatCardModule,
    DirectivesModule
  ],
  exports: [LogFeedComponent]
})
export class LogFeedModule {}
