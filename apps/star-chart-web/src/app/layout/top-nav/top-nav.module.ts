import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { TopNavComponent } from './top-nav.component';
import { ConnectionIndicatorModule } from '../../components/connection-indicator/connection-indicator.module';

@NgModule({
  declarations: [TopNavComponent],
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatMenuModule,
    MatIconModule,
    MatSlideToggleModule,
    MatDividerModule,
    ConnectionIndicatorModule
  ],
  exports: [TopNavComponent]
})
export class TopNavModule { }
