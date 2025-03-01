import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy as any) {
  constructor() {
    super({
      // Extrae el token del header de autorización como Bearer token.
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // No ignorar la expiración del token.
      ignoreExpiration: false,
      // La clave secreta se toma de las variables de entorno.
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  // El método validate se ejecuta cuando se verifica el token.
  // El payload contiene la información que definimos en el AuthService.
  async validate(payload: any) {
    // Verificamos que el payload contenga los datos necesarios
    if (!payload || !payload.sub) {
      throw new Error('Token JWT inválido: falta el identificador de usuario');
    }

    // Retornamos el payload para que esté disponible en el request.
    return { userId: payload.sub, email: payload.email, roles: payload.roles };
  }
}
