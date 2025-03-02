import { Types } from 'mongoose';
import { IsString, IsNotEmpty, IsNumber, Min, IsOptional, IsDate, IsMongoId } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Define la estructura de datos necesaria para crear un nuevo producto.
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

  // Stock mínimo para alertas.
  @ApiProperty({
    description: 'Stock mínimo para alertas',
    example: 5,
    minimum: 0
  })
  @IsNumber({}, { message: 'El stock mínimo debe ser un número' })
  @Min(0, { message: 'El stock mínimo no puede ser negativo' })
  @Type(() => Number)
  readonly minStock: number;

  // Fecha de entrada al inventario.
  @ApiProperty({
    description: 'Fecha de entrada al inventario',
    example: '2024-03-01T12:00:00Z'
  })
  @IsDate({ message: 'La fecha de ingreso debe ser una fecha válida' })
  @Type(() => Date)
  readonly entryDate: Date;

  // Categoría del producto (opcional).
  @ApiPropertyOptional({
    description: 'Categoría principal del producto',
    example: 'Electrónica'
  })
  @IsOptional()
  @IsString({ message: 'La categoría debe ser una cadena de texto' })
  @Transform(({ value }) => value?.trim())
  readonly category?: string;

  // ID de la categoría (opcional).
  @ApiPropertyOptional({
    description: 'ID de la categoría del producto',
    example: '65e5f12c1d35b1e1f3a5b3f1'
  })
  @IsOptional()
  @IsMongoId({ message: 'El ID de categoría debe ser un ID de MongoDB válido' })
  readonly categoryId?: Types.ObjectId;

  // Nombre del proveedor (opcional).
  @ApiPropertyOptional({
    description: 'Nombre del proveedor',
    example: 'Proveedor XYZ'
  })
  @IsOptional()
  @IsString({ message: 'El nombre del proveedor debe ser una cadena de texto' })
  @Transform(({ value }) => value?.trim())
  readonly supplier?: string;

  // ID del proveedor (opcional).
  @ApiPropertyOptional({
    description: 'ID del proveedor del producto',
    example: '65e5f12c1d35b1e1f3a5b3f2'
  })
  @IsOptional()
  @IsMongoId({ message: 'El ID de proveedor debe ser un ID de MongoDB válido' })
  readonly supplierId?: Types.ObjectId;

  // Fecha de la última actualización de stock (opcional).
  @ApiPropertyOptional({
    description: 'Fecha de la última actualización de stock',
    example: '2024-03-05T12:00:00Z'
  })
  @IsOptional()
  @IsDate({ message: 'La fecha de la última actualización debe ser una fecha válida' })
  @Type(() => Date)
  readonly lastStockUpdate?: Date;

  // ID del usuario que crea el producto (requerido).
  @ApiProperty({
    description: 'ID del usuario que registra el producto',
    example: '65e5f12c1d35b1e1f3a5b3f1'
  })
  @IsMongoId({ message: 'El ID de usuario debe ser un ID de MongoDB válido' })
  readonly userId: Types.ObjectId;
}
