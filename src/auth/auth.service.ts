import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<User> {
    try {
      // Verificamos si el usuario ya existe mediante el email.
      const existingUser = await this.userModel.findOne({
        email: createUserDto.email,
      });
      if (existingUser) {
        throw new ConflictException('El usuario ya existe con ese correo electrónico');
      }

      // Hasheamos la contraseña usando bcrypt (número de salt rounds: 10).
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

      // Creamos un nuevo objeto de usuario.
      const newUser = new this.userModel({
        ...createUserDto,
        password: hashedPassword, // Guardamos la contraseña hasheada
      });

      // Guardamos el usuario en la base de datos.
      return await newUser.save();
    } catch (error) {
      // Verificamos que error es de tipo Error
      if (error instanceof ConflictException) {
        throw error;
      }

      if (error.code === 11000) {
        throw new ConflictException('El correo electrónico ya está registrado');
      }

      // En caso de error desconocido, lanzamos un nuevo error
      throw new BadRequestException('Error en el registro: ' + (error.message || 'Error desconocido'));
    }
  }

  async login(loginUserDto: LoginUserDto): Promise<{ token: string }> {
    try {
      // Buscamos el usuario por email.
      const user = await this.userModel.findOne({ email: loginUserDto.email });
      if (!user) {
        throw new UnauthorizedException('No existe un usuario con este correo electrónico');
      }

      // Comparamos la contraseña ingresada con la contraseña hasheada en la base de datos.
      const isMatch = await bcrypt.compare(loginUserDto.password, user.password);
      if (!isMatch) {
        throw new UnauthorizedException('Contraseña incorrecta');
      }

      // Verificar el estado del usuario
      if (user.status !== 'active') {
        throw new UnauthorizedException('La cuenta está inactiva o bloqueada. Contacte al administrador.');
      }

      // Si la validación es correcta, generamos un token JWT con información del usuario.
      const payload = { sub: user._id, email: user.email, roles: user.roles };
      const token = this.jwtService.sign(payload);

      // Actualizamos el campo de último login.
      user.lastLogin = new Date();
      await user.save();

      return { token };
    } catch (error) {
      // Validamos el tipo de error antes de usarlo
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Error de autenticación: ' + (error.message || 'Error desconocido'));
    }
  }
}
