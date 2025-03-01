import { Types } from 'mongoose';
import { IsString, IsNotEmpty, IsNumber, Min, IsOptional, IsDate, IsMongoId, ValidateIf } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Define la estructura de datos necesaria para crear un nuevo producto.
// Estos campos corresponden a los definidos en el esquema.`
export class CreateProductDto {
  // Nombre del producto (requerido)
  @ApiProperty({
    description: 'El nombre del producto',
    example: 'Laptop HP Pavilion',
    required: true
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @Transform(({ value }) => value?.trim())
  readonly name: string;

  // Descripción del producto (opcional)
  @ApiPropertyOptional({
    description: 'Descripción detallada del producto',
    example: 'Laptop HP Pavilion con procesador Intel Core i7, 16GB RAM'
  })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @Transform(({ value }) => value?.trim())
  readonly description?: string;

  // Precio del producto (requerido, no negativo)
  @ApiProperty({
    description: 'Precio del producto',
    example: 999.99,
    minimum: 0
  })
  @IsNumber({}, { message: 'El precio debe ser un número' })
  @Min(0, { message: 'El precio no puede ser negativo' })
  @Type(() => Number)
  readonly price: number;

  // Stock disponible (requerido, entero y no negativo)
  @ApiProperty({
    description: 'Cantidad disponible en stock',
    example: 10,
    minimum: 0
  })
  @IsNumber({}, { message: 'El stock debe ser un número' })
  @Min(0, { message: 'El stock no puede ser negativo' })
  @Type(() => Number)
  readonly stock: number;

  // Fecha de entrada al inventario
  @ApiProperty({
    description: 'Fecha de entrada al inventario',
    example: '2024-03-01T12:00:00Z'
  })
  @IsDate({ message: 'La fecha de ingreso debe ser una fecha válida' })
  @Type(() => Date)
  readonly entryDate: Date;

  // Fecha de expiración o caducidad (opcional)
  @ApiPropertyOptional({
    description: 'Fecha de expiración/caducidad del producto (si aplica)',
    example: '2025-03-01T12:00:00Z'
  })
  @IsOptional()
  @IsDate({ message: 'La fecha de caducidad debe ser una fecha válida' })
  @ValidateIf((o) => o.expirationDate !== null && o.expirationDate !== undefined)
  @Type(() => Date)
  readonly expirationDate?: Date;

  // Categoría del producto (opcional)
  @ApiPropertyOptional({
    description: 'Categoría principal del producto',
    example: 'Electrónica'
  })
  @IsOptional()
  @IsString({ message: 'La categoría debe ser una cadena de texto' })
  @Transform(({ value }) => value?.trim())
  readonly category?: string;

  // Subcategoría del producto (opcional)
  @ApiPropertyOptional({
    description: 'Subcategoría del producto',
    example: 'Laptops'
  })
  @IsOptional()
  @IsString({ message: 'La subcategoría debe ser una cadena de texto' })
  @Transform(({ value }) => value?.trim())
  readonly subCategory?: string;

  // ID del usuario que crea el producto
  @ApiProperty({
    description: 'ID del usuario que registra el producto',
    example: '65e5f12c1d35b1e1f3a5b3f1'
  })
  @IsMongoId({ message: 'El ID de usuario debe ser un ID de MongoDB válido' })
  readonly userId: Types.ObjectId;
}
