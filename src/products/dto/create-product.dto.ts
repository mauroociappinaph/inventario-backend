import { Types } from 'mongoose';
import { IsString, IsNotEmpty, IsNumber, Min, IsOptional, IsDate, IsMongoId, ValidateIf } from 'class-validator';
import { Transform, Type } from 'class-transformer';

// Define la estructura de datos necesaria para crear un nuevo producto.
// Estos campos corresponden a los definidos en el esquema.`
export class CreateProductDto {
  // Nombre del producto (requerido)
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @Transform(({ value }) => value?.trim())
  readonly name: string;

  // Descripción del producto (opcional)
  @IsOptional()
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @Transform(({ value }) => value?.trim())
  readonly description?: string;

  // Precio del producto (requerido, no negativo)
  @IsNumber({}, { message: 'El precio debe ser un número' })
  @Min(0, { message: 'El precio no puede ser negativo' })
  @Type(() => Number)
  readonly price: number;

  // Stock disponible (requerido, entero y no negativo)
  @IsNumber({}, { message: 'El stock debe ser un número' })
  @Min(0, { message: 'El stock no puede ser negativo' })
  @Type(() => Number)
  readonly stock: number;

  // Fecha de ingreso del producto (requerido)
  @IsDate({ message: 'La fecha de ingreso debe ser una fecha válida' })
  @Type(() => Date)
  readonly entryDate: Date;

  // Fecha de caducidad del producto (opcional)
  @IsOptional()
  @IsDate({ message: 'La fecha de caducidad debe ser una fecha válida' })
  @ValidateIf((o) => o.expirationDate !== null && o.expirationDate !== undefined)
  @Type(() => Date)
  readonly expirationDate?: Date;

  // Categoría del producto (opcional)
  @IsOptional()
  @IsString({ message: 'La categoría debe ser una cadena de texto' })
  @Transform(({ value }) => value?.trim())
  readonly category?: string;

  // Subcategoría del producto (opcional)
  @IsOptional()
  @IsString({ message: 'La subcategoría debe ser una cadena de texto' })
  @Transform(({ value }) => value?.trim())
  readonly subCategory?: string;

  // ID del usuario que crea el producto (requerido)
  @IsMongoId({ message: 'El ID de usuario debe ser un ID de MongoDB válido' })
  readonly userId: Types.ObjectId;
}
