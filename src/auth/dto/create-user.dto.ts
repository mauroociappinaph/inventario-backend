// Este DTO define los datos necesarios para registrar un nuevo usuario.
export class CreateUserDto {
  // El email es requerido y debe ser único.
  email: string;

  // La contraseña es requerida.
  password: string;

  // El nombre de la compañía es requerido.
  companyName: string;
}
