// Este DTO define los datos necesarios para el inicio de sesión.
export class LoginUserDto {
  // Se requiere el email para identificar al usuario.
  email: string;

  // Se requiere la contraseña para autenticar.
  password: string;
}
