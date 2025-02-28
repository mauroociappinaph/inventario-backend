import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
// Extendemos el AuthGuard de Passport para usar la estrategia 'jwt'.
// Esto hace que, al aplicar este guard, se valide el token JWT enviado en la cabecera.
export class JwtAuthGuard extends AuthGuard('jwt') {}
