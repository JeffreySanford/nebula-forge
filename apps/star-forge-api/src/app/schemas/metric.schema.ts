import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Metric extends Document {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  value!: number;

  @Prop({ required: true })
  unit!: string;

  @Prop({ default: Date.now })
  timestamp!: Date;

  @Prop({ required: true })
  source!: string;

  @Prop({ required: true })
  type!: string;

  @Prop()
  color?: string;
}

export const MetricSchema = SchemaFactory.createForClass(Metric);
