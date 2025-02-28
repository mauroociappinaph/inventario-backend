import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

@Controller('auth')
export class AuthController {
  // Inyectamos el servicio de autenticación.
  constructor(private authService: AuthService) {}

  // Endpoint para registrar un usuario nuevo.
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    // Llama al método register del servicio y devuelve el usuario creado.
    return this.authService.register(createUserDto);
  }

  // Endpoint para iniciar sesión.
  @Post('login')
  async login(@Body() loginUserDto: LoginUserDto) {
    // Llama al método login del servicio y devuelve el token JWT.
    return this.authService.login(loginUserDto);
  }
}
