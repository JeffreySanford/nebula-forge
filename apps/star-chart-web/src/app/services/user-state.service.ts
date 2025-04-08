import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError, shareReplay } from 'rxjs/operators';
import { UserState } from '../interfaces/user-state.interface';

@Injectable({
  providedIn: 'root'
})
export class UserStateService {
  private userStateSubject = new BehaviorSubject<UserState | null>(null);
  userState$ = this.userStateSubject.asObservable();
  
  // Cache HTTP request
  private fetchRequest$: Observable<UserState> | null = null;
  
  constructor(private http: HttpClient) {}
  
  fetch(): Observable<UserState> {
    // Create a shared, replayable stream if one doesn't exist
    if (!this.fetchRequest$) {
      this.fetchRequest$ = this.http.get<UserState>('/api/user-state').pipe(
        tap(state => this.userStateSubject.next(state)),
        catchError(error => {
          console.error('Error fetching user state', error);
          // Create a default state on error
          const defaultState: UserState = {
            id: 'guest',
            username: 'guest',
            state: 'active',
            roles: ['guest']
          };
          this.userStateSubject.next(defaultState);
          return of(defaultState);
        }),
        shareReplay(1) // Share the result with all subscribers and replay to late subscribers
      );
    }
    
    return this.fetchRequest$;
  }
  
  getUserState(): Observable<UserState> {
    // If no state exists yet, fetch it
    if (!this.userStateSubject.getValue()) {
      return this.fetch();
    }
    return this.userState$ as Observable<UserState>;
  }
  
  getCurrentState(): UserState {
    return this.userStateSubject.getValue() || {
      id: 'guest',
      username: 'guest',
      state: 'active',
      roles: ['guest']
    };
  }
  
  updateUserState(newState: Partial<UserState>): void {
    const currentState = this.userStateSubject.getValue();
    if (currentState) {
      this.userStateSubject.next({
        ...currentState,
        ...newState
      });
    }
  }
  
  // Method to refresh user state from the server
  refreshUserState(): Observable<UserState> {
    this.fetchRequest$ = null; // Clear cached request
    return this.fetch();
  }
}
