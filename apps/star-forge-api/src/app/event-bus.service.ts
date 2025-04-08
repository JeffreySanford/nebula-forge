import { Injectable } from '@nestjs/common';
import { Subject, Observable, BehaviorSubject } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export interface Event<T = unknown> {
  type: string;
  payload: T;
}

interface AppState {
  [key: string]: unknown;
}

@Injectable()
export class EventBusService {
  private eventSubject = new Subject<Event>();
  private stateSubject = new BehaviorSubject<AppState>({});
  
  // Observable stream of all events
  events$ = this.eventSubject.asObservable();
  
  // Observable stream of application state
  state$ = this.stateSubject.asObservable();
  
  // Emit a new event
  emit<T>(type: string, payload: T): void {
    this.eventSubject.next({ type, payload });
  }
  
  // Listen for events of a specific type
  on<T>(type: string): Observable<T> {
    return this.events$.pipe(
      filter(event => event.type === type),
      map(event => event.payload as T)
    );
  }
  
  // Update part of the application state
  updateState(newState: Partial<AppState>): void {
    this.stateSubject.next({
      ...this.stateSubject.getValue(),
      ...newState
    });
  }
  
  // Get specific portion of state as observable
  selectState<T>(selector: (state: AppState) => T): Observable<T> {
    return this.state$.pipe(
      map(selector)
    );
  }
  
  // Get current state value
  getState(): AppState {
    return this.stateSubject.getValue();
  }
}
