import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';
import { ObjectType, Field, InputType, Float } from '@nestjs/graphql';

@ObjectType()
export class MetricType {
  @Field(() => String)
  id!: string;

  @Field(() => String)
  @IsString()
  name!: string;

  @Field(() => Float)
  @IsNumber()
  value!: number;

  @Field(() => String)
  @IsString()
  unit!: string;

  @Field(() => Date)
  @IsDate()
  timestamp!: Date;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  source?: string;

  @Field(() => String)
  @IsString()
  type!: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  color?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  metadata?: string | null; // Using string instead of any, assuming metadata is a JSON string
}

@InputType()
export class CreateMetricInput {
  @Field(() => String)
  @IsString()
  name: string;

  @Field(() => Float)
  @IsNumber()
  value: number;

  @Field(() => String)
  @IsString()
  unit: string;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  timestamp?: Date;

  @Field(() => String)
  @IsString()
  source: string;

  @Field(() => String)
  @IsString()
  type: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  color?: string;
}
