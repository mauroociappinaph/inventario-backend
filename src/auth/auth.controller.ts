import { Controller, Post, Body, UseGuards, HttpStatus, HttpCode, ValidationPipe, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { LoginThrottlerGuard } from '../common/guards/throttle.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  // Inyectamos el servicio de autenticación.
  constructor(private authService: AuthService) {}

  // Endpoint para registrar un usuario nuevo.
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un nuevo usuario' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos de usuario inválidos' })
  @ApiResponse({ status: 409, description: 'El correo electrónico ya existe' })
  async register(@Body(new ValidationPipe({ transform: true })) createUserDto: CreateUserDto) {
    try {
      // Llama al método register del servicio y devuelve el usuario creado.
      this.logger.log(`Intentando registrar usuario con email: ${createUserDto.email}`);
      const result = await this.authService.register(createUserDto);
      this.logger.log(`Usuario registrado exitosamente: ${createUserDto.email}`);
      return {
        statusCode: HttpStatus.CREATED,
        message: 'Usuario registrado exitosamente',
        data: result,
      };
    } catch (error) {
      this.logger.error(`Error al registrar usuario: ${error.message}`, error.stack);

      if (error.code === 11000) {
        throw new BadRequestException({
          statusCode: HttpStatus.CONFLICT,
          message: 'El correo electrónico ya está registrado',
          error: 'Conflict',
        });
      }

      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: error.message || 'Error al registrar usuario',
        error: 'Bad Request',
      });
    }
  }

  // Endpoint para iniciar sesión.
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LoginThrottlerGuard)
  @ApiOperation({ summary: 'Iniciar sesión de usuario' })
  @ApiBody({ type: LoginUserDto })
  @ApiResponse({ status: 200, description: 'Login exitoso' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  @ApiResponse({ status: 403, description: 'Demasiados intentos de inicio de sesión' })
  async login(@Body(new ValidationPipe({ transform: true })) loginUserDto: LoginUserDto) {
    try {
      // Llama al método login del servicio y devuelve el token JWT.
      this.logger.log(`Intento de inicio de sesión para: ${loginUserDto.email}`);
      const result = await this.authService.login(loginUserDto);
      this.logger.log(`Inicio de sesión exitoso para: ${loginUserDto.email}`);
      return {
        statusCode: HttpStatus.OK,
        message: 'Inicio de sesión exitoso',
        data: result,
      };
    } catch (error) {
      this.logger.error(`Error de inicio de sesión para ${loginUserDto.email}: ${error.message}`);

      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: error.message || 'Credenciales inválidas',
        error: 'Unauthorized',
      });
    }
  }
}
