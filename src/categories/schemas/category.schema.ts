import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({ timestamps: true })
export class Category {
  // Nombre de la categoría, requerido y único
  @Prop({ required: true, unique: true })
  name: string;

  // Descripción de la categoría, opcional
  @Prop()
  description: string;

  // Color para la UI, opcional
  @Prop()
  color: string;

  // Icono para la UI, opcional
  @Prop()
  icon: string;

  // Estado de la categoría: activa, inactiva
  @Prop({ default: 'activa', enum: ['activa', 'inactiva'] })
  status: string;

  // Posición para ordenamiento en la UI
  @Prop({ default: 0 })
  position: number;

  // Indicador de categoría para mostrar en la UI
  @Prop({ default: false })
  featured: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
