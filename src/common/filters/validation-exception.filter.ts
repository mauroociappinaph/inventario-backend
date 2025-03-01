import { ExceptionFilter, Catch, ArgumentsHost, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { ValidationError } from 'class-validator';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    // Obtener el mensaje de error original
    const exceptionResponse = exception.getResponse() as any;

    // Verificar si es un error de validación
    if (exceptionResponse && Array.isArray(exceptionResponse.message)) {
      const validationErrors = exceptionResponse.message;

      // Formatear los errores de validación para una respuesta más amigable
      const formattedErrors = this.formatErrors(validationErrors);

      return response.status(status).json({
        statusCode: status,
        message: 'Error de validación',
        errors: formattedErrors,
        timestamp: new Date().toISOString(),
      });
    }

    // Si no es un error de validación, devolver la respuesta estándar
    return response.status(status).json({
      statusCode: status,
      message: exceptionResponse.message || 'Error de solicitud',
      timestamp: new Date().toISOString(),
    });
  }

  private formatErrors(errors: any[]): Record<string, string[]> {
    const result: Record<string, string[]> = {};

    errors.forEach((error) => {
      const property = error.property;
      const constraints = error.constraints;

      if (constraints) {
        result[property] = Object.values(constraints);
      }

      // Manejar errores anidados
      if (error.children && error.children.length > 0) {
        const nestedErrors = this.formatErrors(error.children);
        Object.keys(nestedErrors).forEach((key) => {
          result[`${property}.${key}`] = nestedErrors[key];
        });
      }
    });

    return result;
  }
}
