import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrderDocument = Order & Document;

// Esquema para los ítems del pedido
@Schema({ _id: false })
export class OrderItem {
  // Referencia al producto
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  // Cantidad solicitada
  @Prop({ required: true, min: 1 })
  quantity: number;

  // Precio unitario en el momento del pedido
  @Prop({ required: true, min: 0 })
  unitPrice: number;

  // Subtotal del ítem (cantidad * precio unitario)
  @Prop({ required: true, min: 0 })
  subtotal: number;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

// Esquema para el historial de estados del pedido
@Schema({ _id: false, timestamps: true })
export class OrderStatus {
  // Estado del pedido
  @Prop({ required: true, enum: ['pendiente', 'confirmado', 'en_proceso', 'enviado', 'entregado', 'cancelado'] })
  status: string;

  // Fecha del cambio de estado
  @Prop({ required: true, default: Date.now })
  date: Date;

  // Usuario que realizó el cambio de estado
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  // Comentario opcional sobre el cambio de estado
  @Prop()
  comment: string;
}

export const OrderStatusSchema = SchemaFactory.createForClass(OrderStatus);

// Esquema principal del pedido
@Schema({ timestamps: true })
export class Order {
  // Número de orden (único y generado automáticamente)
  @Prop({ required: true, unique: true })
  orderNumber: string;

  // Referencia al usuario que creó el pedido
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  // Referencia al proveedor
  @Prop({ type: Types.ObjectId, ref: 'Supplier', required: true })
  supplierId: Types.ObjectId;

  // Fecha de creación del pedido (se genera automáticamente con timestamps)
  @Prop()
  orderDate: Date;

  // Fecha estimada de entrega
  @Prop()
  estimatedDeliveryDate: Date;

  // Fecha real de entrega
  @Prop()
  actualDeliveryDate: Date;

  // Ítems del pedido
  @Prop({ type: [OrderItemSchema], required: true })
  items: OrderItem[];

  // Estado actual del pedido
  @Prop({
    required: true,
    enum: ['pendiente', 'confirmado', 'en_proceso', 'enviado', 'entregado', 'cancelado'],
    default: 'pendiente'
  })
  currentStatus: string;

  // Historial de estados del pedido
  @Prop({ type: [OrderStatusSchema], default: [] })
  statusHistory: OrderStatus[];

  // Total del pedido
  @Prop({ required: true, min: 0 })
  total: number;

  // Notas adicionales del pedido
  @Prop()
  notes: string;

  // Dirección de entrega (opcional)
  @Prop()
  deliveryAddress: string;

  // Método de pago
  @Prop({ enum: ['efectivo', 'transferencia', 'credito', 'otro'] })
  paymentMethod: string;

  // Estado del pago
  @Prop({ enum: ['pendiente', 'parcial', 'pagado'], default: 'pendiente' })
  paymentStatus: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
