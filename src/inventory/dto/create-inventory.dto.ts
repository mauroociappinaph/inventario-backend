import { Types } from 'mongoose';
import { IsNotEmpty, IsNumber, Min, IsEnum, IsDate, IsMongoId, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

// Define la estructura de datos necesaria para registrar un movimiento de inventario.
export class CreateInventoryDto {
  // ID del producto afectado
  @IsNotEmpty({ message: 'El ID del producto es requerido' })
  @IsMongoId({ message: 'El ID del producto debe ser un ID de MongoDB válido' })
  readonly productId: Types.ObjectId;

  // Cantidad de movimiento (ej: 10 para una entrada, 10 para una salida)
  @IsNotEmpty({ message: 'La cantidad es requerida' })
  @IsNumber({}, { message: 'La cantidad debe ser un número' })
  @Min(1, { message: 'La cantidad debe ser mayor a cero' })
  @Type(() => Number)
  readonly quantity: number;

  // Tipo de movimiento: 'in' para entrada, 'out' para salida
  @IsNotEmpty({ message: 'El tipo de movimiento es requerido' })
  @IsEnum(['in', 'out'], { message: 'El tipo de movimiento debe ser "in" o "out"' })
  readonly movementType: 'in' | 'out';

  // Fecha del movimiento
  @IsNotEmpty({ message: 'La fecha del movimiento es requerida' })
  @IsDate({ message: 'La fecha del movimiento debe ser una fecha válida' })
  @Type(() => Date)
  readonly movementDate: Date;

  // ID del usuario que realizó el movimiento
  @IsNotEmpty({ message: 'El ID del usuario es requerido' })
  @IsMongoId({ message: 'El ID del usuario debe ser un ID de MongoDB válido' })
  readonly userId: Types.ObjectId;
}
