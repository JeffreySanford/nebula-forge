import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { GraphQLTileComponent } from './graphql-tile.component';

@NgModule({
  declarations: [GraphQLTileComponent],
  imports: [
    CommonModule,
    MatCardModule
  ],
  exports: [GraphQLTileComponent]
})
export class GraphQLTileModule {}
