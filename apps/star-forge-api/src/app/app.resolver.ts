import { Query, Resolver } from '@nestjs/graphql';
import { Observable, of } from 'rxjs';

@Resolver()
export class AppResolver {
  @Query(() => String)
  hello(): Observable<string> {
    return of('Hello from GraphQL!');
  }
}
