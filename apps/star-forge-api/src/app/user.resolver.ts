import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UserService } from './user.service';
import { ObjectType, Field, InputType } from '@nestjs/graphql';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from './schemas/user.schema';

@ObjectType()
export class UserType {
  @Field(() => String)
  _id!: string;

  @Field(() => String)
  username!: string;

  @Field(() => String, { nullable: true })
  email?: string;
}

@InputType()
export class CreateUserInput {
  @Field(() => String)
  username!: string;

  @Field(() => String, { nullable: true })
  email?: string;
}

@Resolver(() => UserType)
export class UserResolver {
  constructor(private userService: UserService) {}

  @Query(() => [UserType])
  users(): Observable<UserType[]> {
    return this.userService.findAll().pipe(
      map((users: User[]) => users.map(user => this.mapToUserType(user)))
    );
  }

  @Mutation(() => UserType)
  createUser(@Args('input') input: CreateUserInput): Observable<UserType> {
    return this.userService.create(input.username, input.email).pipe(
      map(user => this.mapToUserType(user))
    );
  }

  private mapToUserType(user: User): UserType {
    const userType = new UserType();
    userType._id = user._id?.toString() || '';
    userType.username = user.username;
    userType.email = user.email;
    return userType;
  }
}
