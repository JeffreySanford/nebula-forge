import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { DatabaseTileComponent } from './database-tile.component';

@NgModule({
  declarations: [DatabaseTileComponent],
  imports: [
    CommonModule,
    MatCardModule
  ],
  exports: [DatabaseTileComponent]
})
export class DatabaseTileModule {}
