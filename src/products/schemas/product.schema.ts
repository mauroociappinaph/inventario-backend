import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// Definimos el tipo de documento para TypeScript
export type ProductDocument = Product & Document;

@Schema({ timestamps: true }) // timestamps agrega automáticamente createdAt y updatedAt
export class Product {
  // Nombre del producto, requerido.
  @Prop({ required: true })
  name: string;

  // Precio del producto, requerido y no negativo.
  @Prop({
    required: true,
    min: [0, 'El precio no puede ser negativo']
  })
  price: number;

  // Stock general, requerido y no negativo.
  @Prop({ required: true, min: 0 })
  stock: number;

  // Stock mínimo para alertas.
  @Prop({ default: 0 })
  minStock: number;

  // Fecha de ingreso del producto, con valor por defecto.
  @Prop({ default: Date.now })
  entryDate: Date;

  // Fecha de salida del producto, con valor por defecto.
  @Prop({ default: null })
  exitDate: Date;

  // Referencia a la categoría.
  @Prop({ type: Types.ObjectId, ref: 'Category' })
  categoryId: Types.ObjectId;

  // Nombre de la categoría (redundante para facilitar búsquedas).
  @Prop()
  category: string;

  // Referencia al proveedor principal.
  @Prop({ type: Types.ObjectId, ref: 'Supplier' })
  supplierId: Types.ObjectId;

  // Nombre del proveedor (redundante para facilitar búsquedas).
  @Prop()
  supplier: string;

  // Fecha de la última actualización de stock.
  @Prop()
  lastStockUpdate: Date;

  // ID del usuario que crea el producto.
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;
}

// Creamos el esquema de Mongoose a partir de la clase Product
export const ProductSchema = SchemaFactory.createForClass(Product);
