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


  // Fecha de ingreso del producto, requerido.
  @Prop({ required: true })
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

  // Categoría del producto, opcional.
  @Prop()
  category: string;

  // Subcategoría del producto, opcional.
  @Prop()
  subCategory: string;
}

// Creamos el esquema de Mongoose a partir de la clase Product
export const ProductSchema = SchemaFactory.createForClass(Product);
