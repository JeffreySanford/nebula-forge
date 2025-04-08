import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TopNavModule } from './top-nav/top-nav.module'; // Import the TopNavModule instead

@NgModule({
  imports: [CommonModule, TopNavModule], // Use TopNavModule here
})
export class LayoutModule {}
