import { Injectable } from '@nestjs/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class AppService {
  private message$: BehaviorSubject<string> = new BehaviorSubject<string>('Hello API');

  getData(): Observable<{ message: string }> {
    return this.message$.pipe(
      map(msg => ({ message: msg }))
    );
  }

  updateMessage(newMsg: string): void {
    this.message$.next(newMsg);
  }
}
