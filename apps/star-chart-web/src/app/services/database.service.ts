import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface DbEvent {
  type: 'connection' | 'query' | 'error';
  message: string;
  timestamp: Date;
  operation?: string; // Optional for backward compatibility
  collection?: string; // Optional for backward compatibility
}

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private dbEventsSubject = new BehaviorSubject<DbEvent[]>([]);
  public database$: Observable<DbEvent[]> = this.dbEventsSubject.asObservable();

  constructor() {
    // Simulate database events
    setInterval(() => {
      this.addEvent({
        type: 'query',
        message: `SELECT * FROM users LIMIT ${Math.floor(Math.random() * 20)}`,
        timestamp: new Date(),
        operation: 'SELECT',
        collection: 'users'
      });
    }, 4000);
  }

  addEvent(event: DbEvent): void {
    const currentEvents = this.dbEventsSubject.getValue();
    this.dbEventsSubject.next([...currentEvents, event].slice(-50));
  }

  clearEvents(): void {
    this.dbEventsSubject.next([]);
  }
}
