// Define la estructura para actualizar un movimiento de inventario.
// Todos los campos son opcionales para permitir actualizar sólo lo necesario.
export class UpdateInventoryDto {
  readonly productId?: string;
  readonly quantity?: number;
  readonly movementType?: 'in' | 'out';
  readonly movementDate?: Date;
  readonly userId?: string;
}
