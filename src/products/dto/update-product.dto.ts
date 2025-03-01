import { IsString, IsOptional, IsNumber, Min, IsDate, ValidateIf } from 'class-validator';
import { Transform, Type } from 'class-transformer';

// Este DTO define los campos que se pueden actualizar de un producto.
// Todos los campos son opcionales para permitir actualizar solo los necesarios.
export class UpdateProductDto {
  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @Transform(({ value }) => value?.trim())
  readonly name?: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @Transform(({ value }) => value?.trim())
  readonly description?: string;

  @IsOptional()
  @IsNumber({}, { message: 'El precio debe ser un número' })
  @Min(0, { message: 'El precio no puede ser negativo' })
  @Type(() => Number)
  readonly price?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El stock debe ser un número' })
  @Min(0, { message: 'El stock no puede ser negativo' })
  @Type(() => Number)
  readonly stock?: number;

  @IsOptional()
  @IsDate({ message: 'La fecha de ingreso debe ser una fecha válida' })
  @Type(() => Date)
  readonly entryDate?: Date;

  @IsOptional()
  @IsDate({ message: 'La fecha de caducidad debe ser una fecha válida' })
  @ValidateIf((o) => o.expirationDate !== null && o.expirationDate !== undefined)
  @Type(() => Date)
  readonly expirationDate?: Date;

  @IsOptional()
  @IsString({ message: 'La categoría debe ser una cadena de texto' })
  @Transform(({ value }) => value?.trim())
  readonly category?: string;

  @IsOptional()
  @IsString({ message: 'La subcategoría debe ser una cadena de texto' })
  @Transform(({ value }) => value?.trim())
  readonly subCategory?: string;
}
