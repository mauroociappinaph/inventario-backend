import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as xss from 'xss';

@Injectable()
export class SanitizeMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Sanitizar body
    if (req.body) {
      req.body = this.sanitizeData(req.body);
    }

    // Sanitizar query params - No asignar directamente a req.query
    if (req.query) {
      // Crear un objeto con los valores sanitizados
      const sanitizedQuery = this.sanitizeData({...req.query});

      // Limpiar el objeto query actual
      Object.keys(req.query).forEach(key => {
        delete req.query[key];
      });

      // Añadir los valores sanitizados
      Object.keys(sanitizedQuery).forEach(key => {
        req.query[key] = sanitizedQuery[key];
      });
    }

    // Sanitizar params
    if (req.params) {
      req.params = this.sanitizeData(req.params);
    }

    next();
  }

  private sanitizeData(data: any): any {
    if (!data) return data;

    // Si es un string, sanitizarlo directamente
    if (typeof data === 'string') {
      return xss.filterXSS(data);
    }

    // Si es un array, sanitizar cada elemento
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }

    // Si es un objeto, sanitizar cada propiedad
    if (typeof data === 'object') {
      const sanitizedData = {};

      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          sanitizedData[key] = this.sanitizeData(data[key]);
        }
      }

      return sanitizedData;
    }

    // Para otros tipos (number, boolean, etc.), devolverlos sin cambios
    return data;
  }
}
