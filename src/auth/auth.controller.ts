import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { LoginThrottlerGuard } from '../common/guards/throttle.guard';

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
  @UseGuards(LoginThrottlerGuard)
  async login(@Body() loginUserDto: LoginUserDto) {
    // Llama al método login del servicio y devuelve el token JWT.
    return this.authService.login(loginUserDto);
  }
}
