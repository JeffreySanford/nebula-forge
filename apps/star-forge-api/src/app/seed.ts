import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UserService } from './user.service';
import { Observable, Subject, from } from 'rxjs';
import { take, switchMap, tap, catchError } from 'rxjs/operators';
import { User } from './schemas/user.schema';

function seedDatabase(): Observable<string> {
  const resultSubject = new Subject<string>();

  from(NestFactory.createApplicationContext(AppModule)).pipe(
    switchMap(app => {
      const userService = app.get(UserService);

      return userService.findAll().pipe(
        take(1),
        switchMap((users: User[]) => {
          const exists = users.some((u: User) => u.username === 'jsmith');

          if (!exists) {
            return userService.create('jsmith', 'john.smith@example.com').pipe(
              switchMap((newUser: User) => {
                newUser.id = '0015';
                newUser.name = 'John Smith';
                newUser.roles = ['user', 'editor', 'administrator'];
                
                return from(newUser.save()).pipe(
                  tap(() => {
                    resultSubject.next('User "jsmith" seeded.');
                    app.close();
                    resultSubject.complete();
                  }),
                  catchError(error => {
                    console.error('Failed to save user:', error);
                    resultSubject.error(error);
                    app.close();
                    return [];
                  })
                );
              }),
              catchError(error => {
                console.error('Failed to create user:', error);
                resultSubject.error(error);
                app.close();
                return [];
              })
            );
          } else {
            resultSubject.next('User "jsmith" already exists.');
            app.close();
            resultSubject.complete();
            return [];
          }
        }),
        catchError(error => {
          console.error('Failed to fetch users:', error);
          resultSubject.error(error);
          app.close();
          return [];
        })
      );
    }),
    catchError(error => {
      console.error('Failed to create application context:', error);
      resultSubject.error(error);
      return [];
    })
  ).subscribe();

  return resultSubject.asObservable();
}

seedDatabase().subscribe(
  message => console.log(message),
  error => console.error('Seeding failed:', error)
);
