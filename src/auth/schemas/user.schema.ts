import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
})
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  companyName: string;

  @Prop()
  phone: string;

  @Prop()
  lastLogin: Date;

  @Prop({ type: [String], default: ['usuario'] })
  roles: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);
