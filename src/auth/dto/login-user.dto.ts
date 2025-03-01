import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

// Este DTO define los datos necesarios para el inicio de sesión.
export class LoginUserDto {
  // Se requiere el email para identificar al usuario.
  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  @Transform(({ value }) => value?.trim().toLowerCase())
  email: string;

  // Se requiere la contraseña para autenticar.
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  password: string;
}
