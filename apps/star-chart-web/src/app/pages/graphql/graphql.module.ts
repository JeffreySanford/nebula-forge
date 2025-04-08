import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GraphqlComponent } from './graphql.component';
import { MatCardModule } from '@angular/material/card';
import { GraphQLTileModule } from '../../components/graphql-tile/graphql-tile.module';

@NgModule({
  declarations: [GraphqlComponent],
  imports: [
    CommonModule,
    MatCardModule,
    GraphQLTileModule
  ],
  exports: [GraphqlComponent]
})
export class GraphqlModule {}
