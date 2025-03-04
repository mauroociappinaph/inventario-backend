import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// Define el tipo de documento para Supplier
export type SupplierDocument = Supplier & Document;

@Schema({ timestamps: true }) // Agrega createdAt y updatedAt automáticamente
export class Supplier {
  // Nombre del proveedor, requerido.
  @Prop({ required: true })
  name: string;

  // Correo electrónico del contacto principal, requerido.
  @Prop({ required: true })
  email: string;

  // Número de teléfono, requerido.
  @Prop({ required: true })
  phone: string;

  // Dirección del proveedor, opcional.
  @Prop()
  address: string;

  // Persona de contacto, opcional.
  @Prop()
  contactPerson: string;

  // Notas adicionales, opcional.
  @Prop()
  notes: string;

  // Referencias a los productos que suministra este proveedor.
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Product' }] })
  products: Types.ObjectId[];

  // 🔹 Cambiado: Ahora `categories` es un array de `ObjectId` referenciando `Category`
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Category' }] })
  categories: Types.ObjectId[];

  // Tiempo de entrega promedio en días.
  @Prop({ default: 7 })
  averageDeliveryTime: number;

  // Rating del proveedor (1-5).
  @Prop({ min: 1, max: 5, default: 3 })
  rating: number;

  // Estado del proveedor: activo, inactivo.
  @Prop({ default: 'activo', enum: ['activo', 'inactivo'] })
  status: string;
}

export const SupplierSchema = SchemaFactory.createForClass(Supplier);
