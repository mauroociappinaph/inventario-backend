import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
})
export class User {
  // El email es requerido y debe ser único.
  @Prop({ required: true, unique: true })
  email: string;

  // La contraseña es requerida.
  @Prop({ required: true })
  password: string;

  // Nombre de la compañía, requerido.
  @Prop({ required: true })
  companyName: string;

  // Número de teléfono, opcional.
  @Prop()
  phone: string;

  // Fecha del último login, opcional.
  @Prop()
  lastLogin: Date;

  // Roles del usuario, con un valor por defecto.
  @Prop({ type: [String], default: ['usuario'] })
  roles: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);
