import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InventoryDocument = Inventory & Document;

@Schema({ timestamps: true })
export class Inventory {
  // Referencia al producto afectado
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  // Nombre del producto (redundante para facilitar consultas)
  @Prop({ required: true })
  productName: string;

  // Cantidad afectada en el movimiento (positiva para entradas, negativa para salidas)
  @Prop({ required: true })
  quantity: number;

  // Tipo de movimiento: 'entrada', 'salida', 'ajuste'
  @Prop({ required: true, enum: ['entrada', 'salida', 'ajuste'] })
  type: string;

  // Fecha en que se realizó el movimiento
  @Prop({ required: true, default: Date.now })
  date: Date;

  // Usuario que realizó el movimiento (referencia)
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  // Nombre del usuario (redundante para facilitar consultas)
  @Prop({ required: true })
  userName: string;

  // Notas o comentarios adicionales
  @Prop()
  notes: string;

  // Documento de referencia (número de factura, orden, etc.)
  @Prop()
  referenceDocument: string;

  // Saldo resultante después del movimiento
  @Prop()
  resultingBalance: number;

  // ¿Se verificó este movimiento?
  @Prop({ default: false })
  verified: boolean;

  // Usuario que verificó el movimiento
  @Prop({ type: Types.ObjectId, ref: 'User' })
  verifiedBy: Types.ObjectId;
}

export const InventorySchema = SchemaFactory.createForClass(Inventory);
