import { IsNotEmpty, IsNumber, IsMongoId, Min } from 'class-validator';
import { Types } from 'mongoose';

export class OrderItemDto {
  @IsNotEmpty({ message: 'El ID del producto es requerido' })
  @IsMongoId({ message: 'ID de producto inválido' })
  productId: Types.ObjectId;

  @IsNotEmpty({ message: 'La cantidad es requerida' })
  @IsNumber({}, { message: 'La cantidad debe ser un número' })
  @Min(1, { message: 'La cantidad mínima es 1' })
  quantity: number;

  @IsNotEmpty({ message: 'El precio unitario es requerido' })
  @IsNumber({}, { message: 'El precio unitario debe ser un número' })
  @Min(0, { message: 'El precio unitario no puede ser negativo' })
  unitPrice: number;

  @IsNotEmpty({ message: 'El subtotal es requerido' })
  @IsNumber({}, { message: 'El subtotal debe ser un número' })
  @Min(0, { message: 'El subtotal no puede ser negativo' })
  subtotal: number;
}
