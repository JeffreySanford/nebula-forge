import { ObjectType, Field, InputType, Float } from '@nestjs/graphql';

@ObjectType()
export class MetricType {
  @Field(() => String)
  id!: string;

  @Field(() => String)
  name!: string;

  @Field(() => Float)
  value!: number;

  @Field(() => String)
  unit!: string;

  @Field(() => Date, { nullable: true })
  timestamp?: Date;

  @Field(() => String)
  source!: string;

  @Field(() => String)
  type!: string;

  @Field(() => String, { nullable: true })
  color?: string;

  constructor(partial: Partial<MetricType> = {}) {
    Object.assign(this, partial);
  }
}

@InputType()
export class MetricInput {
  @Field(() => String)
  name!: string;

  @Field(() => Float)
  value!: number;

  @Field(() => String)
  unit!: string;

  @Field(() => Date, { nullable: true })
  timestamp?: Date;

  @Field(() => String)
  source!: string;

  @Field(() => String)
  type!: string;

  @Field(() => String, { nullable: true })
  color?: string;

  constructor(partial: Partial<MetricInput> = {}) {
    Object.assign(this, partial);
  }
}
