import { Types } from 'mongoose';

// Define la estructura de datos necesaria para registrar un movimiento de inventario.
export class CreateInventoryDto {
  // ID del producto afectado
  readonly productId: Types.ObjectId;

  // Cantidad de movimiento (ej: 10 para una entrada, 10 para una salida)
  readonly quantity: number;

  // Tipo de movimiento: 'in' para entrada, 'out' para salida
  readonly movementType: 'in' | 'out';

  // Fecha del movimiento
  readonly movementDate: Date;

  // (Opcional) ID del usuario que realizó el movimiento
  readonly userId?: Types.ObjectId;
}
