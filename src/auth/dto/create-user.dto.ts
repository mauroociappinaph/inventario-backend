import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

// Este DTO define los datos necesarios para registrar un nuevo usuario.
export class CreateUserDto {
  // El email es requerido y debe ser único.
  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  @Transform(({ value }) => value?.trim().toLowerCase())
  email: string;

  // La contraseña es requerida y debe cumplir con requisitos de seguridad.
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(30, { message: 'La contraseña no debe exceder los 30 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'La contraseña debe contener al menos una letra mayúscula, una minúscula, un número y un carácter especial',
  })
  password: string;

  // El nombre de la compañía es requerido.
  @IsString({ message: 'El nombre de la compañía debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre de la compañía es requerido' })
  @MinLength(2, { message: 'El nombre de la compañía debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El nombre de la compañía no debe exceder los 100 caracteres' })
  @Transform(({ value }) => value?.trim())
  companyName: string;
}
