import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RoleDocument = Role & Document;

@Schema({ timestamps: true })
export class Role {
  // Nombre del rol, requerido y único
  @Prop({ required: true, unique: true })
  name: string;

  // Descripción del rol, opcional
  @Prop()
  description: string;

  // Lista de permisos asignados a este rol
  @Prop({ type: [String], default: [] })
  permissions: string[];

  // Nivel de acceso (0-100, donde 100 es acceso total)
  @Prop({ min: 0, max: 100, default: 10 })
  accessLevel: number;

  // ¿Es un rol por defecto?
  @Prop({ default: false })
  isDefault: boolean;

  // Estado del rol: activo, inactivo
  @Prop({ default: 'activo', enum: ['activo', 'inactivo'] })
  status: string;
}

export const RoleSchema = SchemaFactory.createForClass(Role);
