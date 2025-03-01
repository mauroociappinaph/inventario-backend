import { IsString, IsEmail, IsOptional, IsArray, IsNumber, Min, Max, IsEnum, ArrayUnique, IsMongoId } from 'class-validator';
import { Types } from 'mongoose';

export class CreateSupplierDto {
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  name: string;

  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email: string;

  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  phone: string;

  @IsOptional()
  @IsString({ message: 'La dirección debe ser una cadena de texto' })
  address?: string;

  @IsOptional()
  @IsString({ message: 'La persona de contacto debe ser una cadena de texto' })
  contactPerson?: string;

  @IsOptional()
  @IsString({ message: 'Las notas deben ser una cadena de texto' })
  notes?: string;

  @IsOptional()
  @IsArray({ message: 'Los productos deben ser un array' })
  @IsMongoId({ each: true, message: 'Los IDs de productos deben ser MongoDB IDs válidos' })
  products?: Types.ObjectId[];

  @IsOptional()
  @IsArray({ message: 'Las categorías deben ser un array' })
  @IsString({ each: true, message: 'Cada categoría debe ser una cadena de texto' })
  @ArrayUnique({ message: 'Las categorías deben ser únicas' })
  categories?: string[];

  @IsOptional()
  @IsNumber({}, { message: 'El tiempo de entrega promedio debe ser un número' })
  @Min(1, { message: 'El tiempo de entrega promedio debe ser al menos 1 día' })
  averageDeliveryTime?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El rating debe ser un número' })
  @Min(1, { message: 'El rating mínimo es 1' })
  @Max(5, { message: 'El rating máximo es 5' })
  rating?: number;

  @IsOptional()
  @IsEnum(['activo', 'inactivo'], { message: 'El estado debe ser "activo" o "inactivo"' })
  status?: string;
}
