import { Injectable, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException, ThrottlerLimitDetail } from '@nestjs/throttler';
import { Request } from 'express';

@Injectable()
export class LoginThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Request): Promise<string> {
    // Usar la dirección IP como identificador para el throttling
    return Promise.resolve(req.ip || 'unknown');
  }

  protected async throwThrottlingException(context: ExecutionContext, throttlerLimitDetail: ThrottlerLimitDetail): Promise<void> {
    // Personalizar el manejo de la excepción si es necesario
    await super.throwThrottlingException(context, throttlerLimitDetail);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      return await super.canActivate(context);
    } catch (error) {
      if (error instanceof ThrottlerException) {
        const request = context.switchToHttp().getRequest<Request>();
        const ip = await this.getTracker(request);

        const limitDetail: ThrottlerLimitDetail = {
          limit: 5, // Valor por defecto de límite
          ttl: 60000, // Tiempo de espera en ms (1 minuto)
          totalHits: 6, // Un valor mayor que el límite
          key: 'login', // Identificador de la ruta o acción
          tracker: ip, // IP u otro identificador único
          timeToExpire: 60000, // Tiempo en ms hasta que expire la limitación
          isBlocked: true, // Indicar que está bloqueado
          timeToBlockExpire: 60000, // Tiempo en ms hasta que expire el bloqueo
        };

        await this.throwThrottlingException(context, limitDetail);
        return false;
      }
      throw error;
    }
  }
}
