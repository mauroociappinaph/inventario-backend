import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    // Importa el módulo de configuración para acceder a las variables de entorno.
    ConfigModule,
    // Importa el modelo de usuario para que pueda inyectarse en el servicio.
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    // Configura el módulo JWT, utilizando la clave secreta de las variables de entorno.
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'miSecretoMuySeguro',
      signOptions: { expiresIn: '1d' }, // El token expirará en 1 día.
    }),
    // Configura Passport para que use la estrategia JWT.
    PassportModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
