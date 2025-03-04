import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// Define el tipo de documento para Inventory
export type InventoryDocument = Inventory & Document;

@Schema({ timestamps: true })
export class Inventory {
  // Referencia al producto
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  // 🔹 Se elimina `productName` para evitar redundancia.

  // Cantidad afectada en el movimiento (positiva para entradas, negativa para salidas)
  @Prop({ required: true })
  quantity: number;

  // Tipo de movimiento: 'entrada', 'salida'
  @Prop({ required: true, enum: ['entrada', 'salida'] })
  type: string;

  // Fecha en que se realizó el movimiento
  @Prop({ required: true, default: () => new Date() })
  date: Date;

  // Usuario que realizó el movimiento
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  // Notas o comentarios adicionales
  @Prop()
  notes: string;

  // Documento de referencia (número de factura, orden, etc.)
  @Prop()
  referenceDocument: string;

  // Saldo resultante después del movimiento
  @Prop({ required: true })
  resultingBalance: number;

  // ¿Se verificó este movimiento?
  @Prop({ default: false })
  verified: boolean;

  // Usuario que verificó el movimiento
  @Prop({ type: Types.ObjectId, ref: 'User' })
  verifiedBy: Types.ObjectId;

  // Fecha de verificación
  @Prop()
  verifiedAt: Date;
}

export const InventorySchema = SchemaFactory.createForClass(Inventory);
