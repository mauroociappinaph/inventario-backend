import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly cache = new Map<string, { data: any; timestamp: number }>();
  private readonly ttl = 60 * 1000; // 1 minuto en milisegundos

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Solo aplicar caché a solicitudes GET
    const request = context.switchToHttp().getRequest();
    if (request.method !== 'GET') {
      return next.handle();
    }

    const cacheKey = this.generateCacheKey(request);
    const cachedItem = this.cache.get(cacheKey);

    // Si hay un elemento en caché y no ha expirado, devolverlo
    if (cachedItem && Date.now() - cachedItem.timestamp < this.ttl) {
      return of(cachedItem.data);
    }

    // Si no hay caché o ha expirado, ejecutar el handler y almacenar el resultado
    return next.handle().pipe(
      tap(data => {
        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now(),
        });
      }),
    );
  }

  private generateCacheKey(request: any): string {
    // Generar una clave única basada en la URL y los parámetros de consulta
    const url = request.url;
    const query = JSON.stringify(request.query);
    return `${url}?${query}`;
  }
}
