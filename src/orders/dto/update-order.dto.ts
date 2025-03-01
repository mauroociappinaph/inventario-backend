import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsDateString, IsEnum, IsString, IsMongoId, IsNotEmpty } from 'class-validator';
import { Types } from 'mongoose';
import { CreateOrderDto } from './create-order.dto';

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  @IsOptional()
  @IsEnum(['pendiente', 'confirmado', 'en_proceso', 'enviado', 'entregado', 'cancelado'], {
    message: 'Estado inválido. Debe ser uno de: pendiente, confirmado, en_proceso, enviado, entregado, cancelado'
  })
  currentStatus?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Fecha de entrega real inválida' })
  actualDeliveryDate?: Date;
}

export class UpdateOrderStatusDto {
  @IsNotEmpty({ message: 'El estado es requerido' })
  @IsEnum(['pendiente', 'confirmado', 'en_proceso', 'enviado', 'entregado', 'cancelado'], {
    message: 'Estado inválido. Debe ser uno de: pendiente, confirmado, en_proceso, enviado, entregado, cancelado'
  })
  status: string;

  @IsOptional()
  @IsString({ message: 'El comentario debe ser una cadena de texto' })
  comment?: string;

  @IsMongoId({ message: 'ID de usuario inválido' })
  userId: Types.ObjectId;
}
