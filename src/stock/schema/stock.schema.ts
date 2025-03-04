import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// Define el tipo de documento para Stock
export type StockDocument = Stock & Document;

@Schema({ timestamps: true }) // Agrega createdAt y updatedAt automáticamente
export class Stock {
  // Referencia única al producto
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  // Saldo actual del producto
  @Prop({ required: true, default: 0 })
  currentStock: number;
}

export const StockSchema = SchemaFactory.createForClass(Stock);

// 📌 Asegurar que cada producto tenga solo un registro en la colección Stock
StockSchema.index({ productId: 1 }, { unique: true });
