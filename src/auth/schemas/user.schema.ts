import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
})
export class User {
  // Nombre completo del usuario
  @Prop({ required: true })
  name: string;

  // Iniciales para avatar
  @Prop()
  initials: string;

  // El email es requerido y debe ser único.
  @Prop({ required: true, unique: true })
  email: string;

  // La contraseña es requerida.
  @Prop({ required: true })
  password: string;

  // URL del avatar, opcional
  @Prop()
  avatar: string;

  // Nombre de la compañía, requerido.
  @Prop({ required: true })
  companyName: string;

  // Número de teléfono, opcional.
  @Prop()
  phone: string;

  // Fecha del último login, opcional.
  @Prop()
  lastLogin: Date;

  // Referencia al rol principal
  @Prop({ type: Types.ObjectId, ref: 'Role' })
  roleId: Types.ObjectId;

  // Roles del usuario (nombres para búsqueda rápida)
  @Prop({ type: [String], default: ['usuario'] })
  roles: string[];

  // Permisos específicos asignados directamente al usuario
  @Prop({ type: [String], default: [] })
  permissions: string[];

  // Estado del usuario: active, inactive, blocked
  @Prop({ default: 'active', enum: ['active', 'inactive', 'blocked'] })
  status: string;

  // Preferencias del usuario (tema, idioma, etc.)
  @Prop({ type: Object, default: {} })
  preferences: Record<string, any>;
}

export const UserSchema = SchemaFactory.createForClass(User);
