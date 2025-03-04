import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsMongoId, IsNumber, IsOptional, Min } from 'class-validator';
import { Types } from 'mongoose';

// Define la estructura para actualizar un movimiento de inventario.
// Todos los campos son opcionales para permitir actualizar solo lo necesario.
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
  @IsEnum(['entrada', 'salida'], { message: 'El tipo de movimiento debe ser "entrada" o "salida"' })
  readonly type?: 'entrada' | 'salida';

  @IsOptional()
  @IsDate({ message: 'La fecha del movimiento debe ser una fecha válida' })
  @Type(() => Date)
  readonly date?: Date;

  @IsOptional()
  @IsMongoId({ message: 'El ID del usuario debe ser un ID de MongoDB válido' })
  readonly userId?: Types.ObjectId;

  @IsOptional()
  readonly notes?: string;

  @IsOptional()
  readonly referenceDocument?: string;

  @IsOptional()
  readonly verified?: boolean;

  @IsOptional()
  @IsMongoId({ message: 'El ID del usuario que verificó debe ser un ID de MongoDB válido' })
  readonly verifiedBy?: Types.ObjectId;

  @IsOptional()
  @IsDate({ message: 'La fecha de verificación debe ser una fecha válida' })
  @Type(() => Date)
  readonly verifiedAt?: Date;
}
