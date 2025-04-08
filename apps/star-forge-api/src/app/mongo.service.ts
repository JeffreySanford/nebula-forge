import { Injectable } from '@nestjs/common';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable()
export class MongoService {
  private statusSubject: BehaviorSubject<string> = new BehaviorSubject<string>('MongoDB is connected (mock)');

  getStatus(): Observable<string> {
    return this.statusSubject.asObservable();
  }
  
  updateStatus(status: string): void {
    this.statusSubject.next(status);
  }
}
