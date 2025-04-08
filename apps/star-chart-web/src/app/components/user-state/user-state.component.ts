import { Component, OnInit } from '@angular/core';
import { UserStateService } from '../../services/user-state.service';
import { UserState } from '../../interfaces/user-state.interface';

@Component({
  selector: 'app-user-state',
  templateUrl: './user-state.component.html',
  styleUrls: ['./user-state.component.scss']
})
export class UserStateComponent implements OnInit {
  state: UserState | null = null;

  constructor(private service: UserStateService) {}

  ngOnInit(): void {
    this.service.userState$.subscribe(state => this.state = state);
    this.service.fetch();
  }
}
