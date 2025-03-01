import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const method = request.method;
    const url = request.url;
    const now = Date.now();

    // Registrar la solicitud entrante
    this.logger.log(`Solicitud entrante: ${method} ${url}`);

    return next
      .handle()
      .pipe(
        tap(() => {
          // Registrar el tiempo de respuesta
          const responseTime = Date.now() - now;
          this.logger.log(`Solicitud completada: ${method} ${url} - ${responseTime}ms`);
        }),
      );
  }
}
