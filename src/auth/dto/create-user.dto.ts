import {
  IsEmail,
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
  IsOptional
} from 'class-validator';
import { Transform } from 'class-transformer';

// Este DTO define los datos necesarios para registrar un nuevo usuario.
export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede exceder los 100 caracteres' })
  name: string;

  @IsEmail({}, { message: 'El email debe ser válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  @Matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
    message: 'El formato de email no es válido',
  })
  @Transform(({ value }) => value?.trim().toLowerCase())
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/, {
    message: 'La contraseña debe contener al menos una letra mayúscula, una minúscula y un número',
  })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre de la compañía es requerido' })
  @MinLength(2, { message: 'El nombre de la compañía debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El nombre de la compañía no debe exceder los 100 caracteres' })
  @Transform(({ value }) => value?.trim())
  companyName: string;

  @IsString()
  @IsOptional()
  @MinLength(2, { message: 'Las iniciales deben tener al menos 2 caracteres' })
  @MaxLength(4, { message: 'Las iniciales no pueden exceder los 4 caracteres' })
  initials?: string;

  @IsString()
  @IsOptional()
  @Matches(/^\+?[0-9]{8,15}$/, {
    message: 'El formato de teléfono no es válido',
  })
  phone?: string;
}
