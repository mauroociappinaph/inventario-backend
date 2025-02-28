import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Definimos el tipo de documento para TypeScript
export type ProductDocument = Product & Document;

@Schema({ timestamps: true }) // timestamps agrega automáticamente createdAt y updatedAt
export class Product {
  // Nombre del producto, requerido.
  @Prop({ required: true })
  name: string;

  // Descripción del producto, opcional.
  @Prop()
  description: string;

  // Precio del producto, requerido y no negativo.
  @Prop({
    required: true,
    min: [0, 'El precio no puede ser negativo']
  })
  price: number;

  // Stock disponible, requerido, no negativo y debe ser entero.
  @Prop({
    required: true,
    min: [0, 'El stock no puede ser negativo'],
    validate: {
      validator: Number.isInteger,
      message: 'El stock debe ser un número entero'
    }
  })
  stock: number;

  // Fecha de ingreso del producto, requerido.
  @Prop({ required: true })
  entryDate: Date;

  // Fecha de caducidad del producto, opcional.
  @Prop()
  expirationDate: Date;

  // Categoría del producto, opcional.
  @Prop()
  category: string;

  // Subcategoría del producto, opcional.
  @Prop()
  subCategory: string;
}

// Creamos el esquema de Mongoose a partir de la clase Product
export const ProductSchema = SchemaFactory.createForClass(Product);
