import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DirectivesModule } from './directives.module';

@NgModule({
  imports: [
    CommonModule,
    DirectivesModule
  ],
  exports: [
    DirectivesModule
  ]
})
export class LogHighlightModule { }
