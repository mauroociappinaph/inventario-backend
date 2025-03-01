import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {
    super({
      // Extrae el token del header de autorización como Bearer token.
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // No ignorar la expiración del token.
      ignoreExpiration: false,
      // La clave secreta se toma de las variables de entorno.
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  // El método validate se ejecuta cuando se verifica el token.
  // El payload contiene la información que definimos en el AuthService.
  async validate(payload: any) {
    const { sub: userId } = payload;

    // Verificar que el usuario existe y está activo
    const user = await this.userModel.findById(userId).select('-password').exec();

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('Usuario inactivo o bloqueado');
    }

    // Actualizar fecha de último acceso
    await this.userModel.findByIdAndUpdate(userId, {
      lastLogin: new Date()
    });

    // Devolver el usuario para que esté disponible en Request
    return {
      userId: user._id,
      email: user.email,
      name: user.name,
      roles: user.roles
    };
  }
}
