import { Injectable } from '@nestjs/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { UserState } from './interfaces/user-state.interface';

@Injectable()
export class UserStateService {
  private readonly userStateSubject: BehaviorSubject<UserState> = new BehaviorSubject<UserState>({
    id: 'unknown',
    username: 'anonymous',
    state: 'active',
    roles: ['user']
  });

  readonly userState$: Observable<UserState> = this.userStateSubject.asObservable();
  
  getCurrentState(): Observable<UserState> {
    return this.userState$;
  }

  updateUserState(newState: UserState): void {
    this.userStateSubject.next(newState);
  }
}
