import { IsNotEmpty, IsArray, IsMongoId, IsOptional, IsString, IsEnum, IsNumber, IsDateString, ValidateNested, ArrayMinSize, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';
import { OrderItemDto } from './order-item.dto';

export class CreateOrderDto {
  @IsNotEmpty({ message: 'El ID del proveedor es requerido' })
  @IsMongoId({ message: 'ID de proveedor inválido' })
  supplierId: Types.ObjectId;

  @IsOptional()
  @IsDateString({}, { message: 'Fecha estimada de entrega inválida' })
  estimatedDeliveryDate?: Date;

  @IsNotEmpty({ message: 'Los ítems son requeridos' })
  @IsArray({ message: 'Los ítems deben ser un array' })
  @ArrayMinSize(1, { message: 'El pedido debe tener al menos un ítem' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsNotEmpty({ message: 'El total es requerido' })
  @IsNumber({}, { message: 'El total debe ser un número' })
  @Min(0, { message: 'El total no puede ser negativo' })
  total: number;

  @IsOptional()
  @IsString({ message: 'Las notas deben ser una cadena de texto' })
  notes?: string;

  @IsOptional()
  @IsString({ message: 'La dirección de entrega debe ser una cadena de texto' })
  deliveryAddress?: string;

  @IsOptional()
  @IsEnum(['efectivo', 'transferencia', 'credito', 'otro'], {
    message: 'El método de pago debe ser: efectivo, transferencia, credito u otro'
  })
  paymentMethod?: string;

  @IsOptional()
  @IsEnum(['pendiente', 'parcial', 'pagado'], {
    message: 'El estado de pago debe ser: pendiente, parcial o pagado'
  })
  paymentStatus?: string;
}
