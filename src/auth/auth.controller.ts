import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Logger, Post, Request, UnauthorizedException, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginThrottlerGuard } from '../common/guards/throttle.guard';
import { AuthResponse, AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

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
      // Log de información recibida (sin contraseña)
      const { password, ...userDataForLog } = createUserDto;
      this.logger.log(`Datos recibidos para registro: ${JSON.stringify(userDataForLog)}`);

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

      // Error específico para correo electrónico duplicado
      if (error.code === 11000 || error.message.includes('ya existe')) {
        throw new BadRequestException({
          statusCode: HttpStatus.CONFLICT,
          message: 'El correo electrónico ya está registrado',
          error: 'Conflict',
        });
      }

      // Error de validación de contraseña
      if (error.message.includes('contraseña') || error.message.includes('password')) {
        throw new BadRequestException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'La contraseña no cumple con los requisitos: debe tener al menos 6 caracteres, una mayúscula, una minúscula y un número o caracter especial',
          error: 'Bad Request',
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
  async login(@Body(new ValidationPipe({ transform: true })) loginUserDto: LoginUserDto): Promise<{
    statusCode: number;
    message: string;
    data: AuthResponse;
  }> {
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

  // Endpoint para renovar el token JWT
  @Get('refresh-token')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar token de autenticación' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Token renovado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async refreshToken(@Request() req): Promise<{
    statusCode: number;
    message: string;
    data: AuthResponse;
  }> {
    try {
      // El usuario ya está verificado por el JwtAuthGuard
      this.logger.log(`Solicitud de renovación de token para usuario ID: ${req.user.sub}`);

      // Llama al método refreshToken del servicio
      const result = await this.authService.refreshToken(req.user);

      this.logger.log(`Token renovado exitosamente para usuario ID: ${req.user.sub}`);
      return {
        statusCode: HttpStatus.OK,
        message: 'Token renovado exitosamente',
        data: result,
      };
    } catch (error) {
      this.logger.error(`Error al renovar token: ${error.message}`, error.stack);
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: error.message || 'Error al renovar token',
        error: 'Unauthorized',
      });
    }
  }
}
