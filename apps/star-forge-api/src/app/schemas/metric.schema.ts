import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Metric extends Document {
  @Prop({ required: true })
  name!: string;
  
  @Prop({ required: true })
  type!: string;
  
  @Prop({ required: true, type: Number })
  value!: number;
  
  @Prop({ type: String })
  unit!: string;
  
  @Prop({ type: Date, default: Date.now })
  timestamp!: Date;
  
  @Prop({ type: String })
  source?: string;
  
  @Prop({ type: String })
  color?: string;
  
  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const MetricSchema = SchemaFactory.createForClass(Metric);

// Add index on timestamp for fast querying
MetricSchema.index({ timestamp: -1 });
// Add compound index for name + timestamp
MetricSchema.index({ name: 1, timestamp: -1 });
// Add index for type for filtering
MetricSchema.index({ type: 1 });
