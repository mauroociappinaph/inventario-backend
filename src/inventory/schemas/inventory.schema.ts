import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InventoryDocument = Inventory & Document;

@Schema({ timestamps: true })
export class Inventory {
  // Referencia al producto afectado
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  // Cantidad afectada en el movimiento (positiva para entradas, negativa para salidas)
  @Prop({ required: true })
  quantity: number;

  // Tipo de movimiento: 'in' para entrada, 'out' para salida
  @Prop({ required: true, enum: ['in', 'out'] })
  movementType: string;

  // Fecha en que se realizó el movimiento
  @Prop({ required: true })
  movementDate: Date;

  // Usuario que realizó el movimiento
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;
}

export const InventorySchema = SchemaFactory.createForClass(Inventory);
