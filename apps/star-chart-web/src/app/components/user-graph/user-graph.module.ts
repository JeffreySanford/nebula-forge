import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserGraphComponent } from './user-graph.component';

@NgModule({
  declarations: [UserGraphComponent],
  imports: [CommonModule],
  exports: [UserGraphComponent]
})
export class UserGraphModule {}
