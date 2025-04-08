import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatabaseComponent } from './database.component';
import { DatabaseRoutingModule } from './database-routing.module';
import { DatabaseTileModule } from '../../components/database-tile/database-tile.module';
import { MatCardModule } from '@angular/material/card';

@NgModule({
  declarations: [DatabaseComponent],
  imports: [
    CommonModule,
    DatabaseRoutingModule,
    MatCardModule,
    DatabaseTileModule
  ]
})
export class DatabaseModule { }
