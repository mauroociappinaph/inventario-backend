import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// Define el tipo de documento para Stock
export type StockDocument = Stock & Document;

@Schema({ timestamps: true }) // Agrega createdAt y updatedAt automáticamente
export class Stock {
  // Referencia al producto
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true, unique: true })
  productId: Types.ObjectId;

  // Saldo actual del producto
  @Prop({ required: true, default: 0 })
  currentStock: number;
}

export const StockSchema = SchemaFactory.createForClass(Stock);
