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

  // Costo del producto, usado para cálculos de ROI.
  @Prop({
    min: [0, 'El costo no puede ser negativo'],
    default: function() {
      // Por defecto, el costo es el 50% del precio si no se especifica
      return this.price ? this.price * 0.5 : 0;
    }
  })
  cost: number;

  // Stock general, requerido y no negativo.
  @Prop({ required: true, min: 0 })
  stock: number;

  // Stock mínimo para alertas.
  @Prop({ default: 0 })
  minStock: number;

  // Fecha de ingreso del producto, con valor por defecto.
  @Prop({ default: Date.now })
  entryDate: Date;

  // Fecha de salida del producto.
  @Prop({ default: null })
  exitDate: Date;

  // Referencia a la categoría (se elimina `category` como string)
  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  categoryId: Types.ObjectId;

  // Referencia al proveedor principal (se elimina `supplier` como string)
  @Prop({ type: Types.ObjectId, ref: 'Supplier' })
  supplierId: Types.ObjectId;

  // Fecha de la última actualización de stock.
  @Prop()
  lastStockUpdate: Date;

  // ID del usuario que crea el producto.
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;
}

// Creamos el esquema de Mongoose a partir de la clase Product
export const ProductSchema = SchemaFactory.createForClass(Product);
