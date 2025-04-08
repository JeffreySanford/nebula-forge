import { Resolver, Query, Subscription } from '@nestjs/graphql';
import { UserStateService } from './user-state.service';
import { UserState } from './interfaces/user-state.interface';
import { ObjectType, Field } from '@nestjs/graphql';
import { Observable } from 'rxjs';

@ObjectType()
export class UserStateType {
  @Field(() => String)
  id!: string;

  @Field(() => String)
  username!: string;

  @Field(() => String)
  state!: 'active' | 'suspended' | 'deleted';

  @Field(() => [String])
  roles!: string[];
}

@Resolver(() => UserStateType)
export class UserStateResolver {
  constructor(private readonly userStateService: UserStateService) {}

  @Query(() => UserStateType)
  userState(): Observable<UserState> {
    return this.userStateService.getCurrentState();
  }

  @Subscription(() => UserStateType)
  userStateUpdates(): Observable<UserState> {
    return this.userStateService.userState$;
  }
}
