import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GraphqlComponent } from './graphql.component';
import { GraphqlRoutingModule } from './graphql-routing.module';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { GraphQLTileModule } from '../../components/graphql-tile/graphql-tile.module';

@NgModule({
  declarations: [GraphqlComponent],
  imports: [
    CommonModule,
    GraphqlRoutingModule,
    MatCardModule,
    MatTabsModule,
    MatListModule,
    MatButtonModule,
    GraphQLTileModule
  ]
})
export class GraphqlModule { }
