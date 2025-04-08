import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GraphqlComponent } from './graphql.component';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { GraphQLTileModule } from '../../components/graphql-tile/graphql-tile.module';

@NgModule({
  declarations: [GraphqlComponent],
  imports: [
    CommonModule,
    MatCardModule,
    MatTabsModule,    // Add this for mat-tab-group and mat-tab
    MatListModule,    // Add this for mat-list and mat-list-item
    MatButtonModule,  // Add this for mat-button
    GraphQLTileModule
  ],
  exports: [GraphqlComponent]
})
export class GraphqlModule {}
