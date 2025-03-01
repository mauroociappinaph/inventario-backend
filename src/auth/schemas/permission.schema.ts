import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PermissionDocument = Permission & Document;

@Schema({ timestamps: true })
export class Permission {
  // Nombre del permiso, requerido y único
  @Prop({ required: true, unique: true })
  name: string;

  // Descripción del permiso, opcional
  @Prop()
  description: string;

  // Código del permiso (para uso interno)
  @Prop({ required: true, unique: true })
  code: string;

  // Categoría del permiso (agrupación)
  @Prop({ required: true })
  category: string;

  // Nivel de acceso requerido para otorgar este permiso
  @Prop({ min: 0, max: 100, default: 10 })
  requiredAccessLevel: number;
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);
