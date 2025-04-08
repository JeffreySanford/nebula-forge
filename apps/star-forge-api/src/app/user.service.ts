import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable()
export class UserService {
  private usersSubject: BehaviorSubject<User[]> = new BehaviorSubject<User[]>([]);
  
  constructor(@InjectModel(User.name) private userModel: Model<User>) {
    this.refreshUsers();
  }

  private refreshUsers(): void {
    from(this.userModel.find().exec()).pipe(
      catchError(err => {
        console.error('Failed to refresh users:', err);
        return of([]);
      })
    ).subscribe(users => this.usersSubject.next(users));
  }

  findAll(): Observable<User[]> {
    return this.usersSubject.asObservable();
  }

  create(username: string, email?: string): Observable<User> {
    const newUser = new this.userModel({ username, email });
    return from(newUser.save()).pipe(
      tap(() => this.refreshUsers()),
      catchError(err => {
        console.error('Failed to create user:', err);
        throw err;
      })
    );
  }
}
