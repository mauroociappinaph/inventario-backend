import { BadRequestException, ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { User, UserDocument } from './schemas/user.schema';

// Interfaz para la respuesta de usuario sin contraseña
export interface UserResponse {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  companyName: string;
  roles: string[];
  status: string;
  lastLogin?: Date;
  // ... otros campos excluyendo la contraseña
}

export interface AuthResponse {
  token: string;
  user?: UserResponse;
}

// Interfaz para el payload del JWT
export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  // Otros campos que puedan estar en el payload
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<User> {
    try {
      this.logger.debug(`Intentando registrar usuario: ${createUserDto.email}`);

      // Verificamos si el usuario ya existe mediante el email.
      const existingUser = await this.userModel.findOne({
        email: createUserDto.email,
      });
      if (existingUser) {
        this.logger.warn(`El usuario ya existe: ${createUserDto.email}`);
        throw new ConflictException('El usuario ya existe con ese correo electrónico');
      }

      // No hasheamos manualmente la contraseña aquí, dejamos que el middleware pre-save del esquema lo haga
      this.logger.debug('Creando nuevo usuario, el esquema se encargará de hashear la contraseña');

      // Creamos un nuevo objeto de usuario con la contraseña sin hashear
      // El middleware pre-save en user.schema.ts se encargará de hashearla
      const newUser = new this.userModel({
        ...createUserDto,
      });

      // Guardamos el usuario en la base de datos.
      const savedUser = await newUser.save();
      this.logger.debug(`Usuario registrado exitosamente: ${savedUser.email}`);
      return savedUser;
    } catch (error) {
      // Verificamos que error es de tipo Error
      if (error instanceof ConflictException) {
        throw error;
      }

      if (error.code === 11000) {
        this.logger.warn(`Intento de registro con email duplicado: ${createUserDto.email}`);
        throw new ConflictException('El correo electrónico ya está registrado');
      }

      // En caso de error desconocido, lanzamos un nuevo error
      this.logger.error(`Error en el registro: ${error.message || 'Error desconocido'}`, error.stack);
      throw new BadRequestException('Error en el registro: ' + (error.message || 'Error desconocido'));
    }
  }

  async login(loginUserDto: LoginUserDto): Promise<AuthResponse> {
    try {
      this.logger.debug(`Intento de login para: ${loginUserDto.email}`);

      // Buscamos el usuario por email.
      const user = await this.userModel.findOne({ email: loginUserDto.email });
      if (!user) {
        this.logger.warn(`No existe usuario con email: ${loginUserDto.email}`);
        throw new UnauthorizedException('No existe un usuario con este correo electrónico');
      }

      this.logger.debug(`Usuario encontrado: ${user.email}, verificando contraseña...`);

      // Extraemos la contraseña hasheada para depuración
      const storedHash = user.password;
      this.logger.debug(`Password almacenado (hash): ${storedHash.substring(0, 10)}...`);
      this.logger.debug(`Password ingresado (sin hash): ${loginUserDto.password.substring(0, 2)}...`);

      // Comparamos la contraseña ingresada con la contraseña hasheada en la base de datos.
      this.logger.debug('Comparando contraseñas con bcrypt...');
      const isMatch = await bcrypt.compare(loginUserDto.password, storedHash);
      this.logger.debug(`Resultado de comparación: ${isMatch ? 'Coinciden' : 'No coinciden'}`);

      if (!isMatch) {
        this.logger.warn(`Contraseña incorrecta para usuario: ${user.email}`);
        throw new UnauthorizedException('Contraseña incorrecta');
      }

      // Verificar el estado del usuario
      if (user.status !== 'active') {
        this.logger.warn(`Intento de login con cuenta no activa: ${user.email}, estado: ${user.status}`);
        throw new UnauthorizedException('La cuenta está inactiva o bloqueada. Contacte al administrador.');
      }

      // Si la validación es correcta, generamos un token JWT con información del usuario.
      this.logger.debug('Creando token JWT...');
      const payload = { sub: user._id, email: user.email, roles: user.roles };
      const token = this.jwtService.sign(payload);
      this.logger.debug('Token JWT creado exitosamente');

      // Actualizamos el campo de último login.
      user.lastLogin = new Date();
      await user.save();
      this.logger.debug(`Fecha de último login actualizada para: ${user.email}`);

      // Extraemos el usuario sin la contraseña
      const userObj = user.toObject();
      const { password, ...userWithoutPassword } = userObj;

      return {
        token,
        user: userWithoutPassword as UserResponse
      };
    } catch (error) {
      // Validamos el tipo de error antes de usarlo
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Error de autenticación: ${error.message || 'Error desconocido'}`, error.stack);
      throw new UnauthorizedException('Error de autenticación: ' + (error.message || 'Error desconocido'));
    }
  }

  /**
   * Genera un nuevo token JWT para el usuario basado en su payload actual
   * @param payload El payload del token JWT actual
   * @returns Un nuevo token JWT y los datos del usuario
   */
  async refreshToken(payload: JwtPayload): Promise<AuthResponse> {
    try {
      this.logger.debug(`Refrescando token para usuario ID: ${payload.sub}`);

      // Buscar el usuario por su ID para verificar que sigue existiendo y está activo
      const user = await this.userModel.findById(payload.sub);

      if (!user) {
        this.logger.warn(`Usuario no encontrado para ID: ${payload.sub}`);
        throw new UnauthorizedException('Usuario no encontrado');
      }

      // Verificar el estado del usuario
      if (user.status !== 'active') {
        this.logger.warn(`Intento de refresh con cuenta no activa: ${user.email}, estado: ${user.status}`);
        throw new UnauthorizedException('La cuenta está inactiva o bloqueada');
      }

      // Generar un nuevo token JWT con la misma información
      this.logger.debug('Generando nuevo token JWT...');
      const newPayload = { sub: user._id, email: user.email, roles: user.roles };
      const token = this.jwtService.sign(newPayload);
      this.logger.debug('Nuevo token JWT generado exitosamente');

      // Extraer el usuario sin la contraseña
      const userObj = user.toObject();
      const { password, ...userWithoutPassword } = userObj;

      return {
        token,
        user: userWithoutPassword as UserResponse
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Error al refrescar token: ${error.message || 'Error desconocido'}`, error.stack);
      throw new UnauthorizedException('Error al refrescar token: ' + (error.message || 'Error desconocido'));
    }
  }
}
