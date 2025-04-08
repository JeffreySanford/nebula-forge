import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { UserStateComponent } from './user-state.component';

@NgModule({
  declarations: [UserStateComponent],
  imports: [CommonModule, MatCardModule],
  exports: [UserStateComponent]
})
export class UserStateModule {}
