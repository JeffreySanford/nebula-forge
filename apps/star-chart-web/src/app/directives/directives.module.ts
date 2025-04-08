import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MockDataDirective } from './mock-data.directive';
import { LogHighlightDirective } from './log-highlight.directive';

@NgModule({
  declarations: [
    MockDataDirective,
    LogHighlightDirective
  ],
  imports: [
    CommonModule
  ],
  exports: [
    MockDataDirective,
    LogHighlightDirective
  ]
})
export class DirectivesModule { }
