import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Message {
  @Field(() => String)
  id!: string;

  @Field(() => String)
  content!: string;
}
