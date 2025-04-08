import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class User extends Document {
  @Prop({ required: true })
  username!: string;

  @Prop()
  email?: string;

  @Prop()
  name?: string;

  @Prop({ default: ['user'] })
  roles!: string[];

  // Use declare to avoid TypeScript error with Document base class
  declare id?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
