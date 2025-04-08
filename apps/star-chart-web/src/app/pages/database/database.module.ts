import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatabaseComponent } from './database.component';
import { MatCardModule } from '@angular/material/card';
import { DatabaseTileModule } from '../../components/database-tile/database-tile.module';

@NgModule({
  declarations: [DatabaseComponent],
  imports: [
    CommonModule,
    MatCardModule,
    DatabaseTileModule
  ],
  exports: [DatabaseComponent]
})
export class DatabaseModule {}
