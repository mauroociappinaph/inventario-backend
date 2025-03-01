import { IsOptional, IsNumber, Min, IsEnum, IsDate, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

// Define la estructura para actualizar un movimiento de inventario.
// Todos los campos son opcionales para permitir actualizar sólo lo necesario.
export class UpdateInventoryDto {
  @IsOptional()
  @IsMongoId({ message: 'El ID del producto debe ser un ID de MongoDB válido' })
  readonly productId?: Types.ObjectId;

  @IsOptional()
  @IsNumber({}, { message: 'La cantidad debe ser un número' })
  @Min(1, { message: 'La cantidad debe ser mayor a cero' })
  @Type(() => Number)
  readonly quantity?: number;

  @IsOptional()
  @IsEnum(['in', 'out'], { message: 'El tipo de movimiento debe ser "in" o "out"' })
  readonly movementType?: 'in' | 'out';

  @IsOptional()
  @IsDate({ message: 'La fecha del movimiento debe ser una fecha válida' })
  @Type(() => Date)
  readonly movementDate?: Date;

  @IsOptional()
  @IsMongoId({ message: 'El ID del usuario debe ser un ID de MongoDB válido' })
  readonly userId?: Types.ObjectId;
}
