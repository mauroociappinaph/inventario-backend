import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

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

  // Código de barras o SKU, opcional pero único si existe
  @Prop({ unique: true, sparse: true })
  barcode: string;

  // Precio del producto, requerido y no negativo.
  @Prop({
    required: true,
    min: [0, 'El precio no puede ser negativo']
  })
  price: number;

  // Stock mínimo para alertas
  @Prop({ default: 0 })
  minStock: number;

  // URL de la imagen del producto
  @Prop()
  imageUrl: string;

  // Fecha de ingreso del producto, requerido.
  @Prop({ required: true, default: Date.now })
  entryDate: Date;

  // Fecha de caducidad del producto, opcional.
  @Prop({
    validate: {
      validator: function(expirationDate: Date) {
        // Si no hay fecha de caducidad, se considera válido
        if (!expirationDate) return true;
        // Verifica que la fecha de caducidad sea posterior a la fecha de ingreso
        return expirationDate > this.entryDate;
      },
      message: 'La fecha de caducidad debe ser posterior a la fecha de ingreso'
    }
  })
  expirationDate: Date;

  // Referencia a la categoría
  @Prop({ type: Types.ObjectId, ref: 'Category' })
  categoryId: Types.ObjectId;

  // Nombre de la categoría (redundante para facilitar búsquedas)
  @Prop()
  category: string;

  // Subcategoría del producto, opcional.
  @Prop()
  subCategory: string;

  // Referencia al proveedor principal
  @Prop({ type: Types.ObjectId, ref: 'Supplier' })
  supplierId: Types.ObjectId;

  // Nombre del proveedor (redundante para facilitar búsquedas)
  @Prop()
  supplier: string;

  // Estado del producto: activo, inactivo, descontinuado
  @Prop({ default: 'activo', enum: ['activo', 'inactivo', 'descontinuado'] })
  status: string;

  // Almacena la fecha de la última actualización de stock
  @Prop()
  lastStockUpdate: Date;
}

// Creamos el esquema de Mongoose a partir de la clase Product
export const ProductSchema = SchemaFactory.createForClass(Product);
