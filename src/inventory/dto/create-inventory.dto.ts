import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsMongoId, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { Types } from 'mongoose';

// Define la estructura de datos necesaria para registrar un movimiento de inventario.
export class CreateInventoryDto {
  // ID del producto afectado
  @IsNotEmpty({ message: 'El ID del producto es requerido' })
  @IsMongoId({ message: 'El ID del producto debe ser un ID de MongoDB válido' })
  readonly productId: Types.ObjectId;

  // Cantidad de movimiento (positivo para entrada, negativo para salida)
  @IsNotEmpty({ message: 'La cantidad es requerida' })
  @IsNumber({}, { message: 'La cantidad debe ser un número' })
  @Min(1, { message: 'La cantidad debe ser mayor a cero' })
  @Type(() => Number)
  readonly quantity: number;

  // Tipo de movimiento: 'entrada' o 'salida'
  @IsNotEmpty({ message: 'El tipo de movimiento es requerido' })
  @IsEnum(['entrada', 'salida'], { message: 'El tipo de movimiento debe ser "entrada" o "salida"' })
  readonly type: 'entrada' | 'salida';

  // Fecha del movimiento
  @IsNotEmpty({ message: 'La fecha del movimiento es requerida' })
  @IsDate({ message: 'La fecha del movimiento debe ser una fecha válida' })
  @Type(() => Date)
  readonly date: Date;

  // ID del usuario que realizó el movimiento
  @IsNotEmpty({ message: 'El ID del usuario es requerido' })
  @IsMongoId({ message: 'El ID del usuario debe ser un ID de MongoDB válido' })
  readonly userId: Types.ObjectId;

  // Notas o comentarios adicionales (opcional)
  readonly notes?: string;

  // Documento de referencia (opcional, por ejemplo, número de factura)
  readonly referenceDocument?: string;
}
