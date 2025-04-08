import { Query, Resolver } from '@nestjs/graphql';
import { Message } from './dto/message.dto';
import { Observable, of } from 'rxjs';

@Resolver(() => Message)
export class MessageResolver {
  @Query(() => Message)
  getMessage(): Observable<Message> {
    return of({ id: '1', content: 'This is a GraphQL DTO response' });
  }
}
