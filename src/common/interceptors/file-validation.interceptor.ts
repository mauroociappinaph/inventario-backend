import { CallHandler, ExecutionContext, Injectable, NestInterceptor, BadRequestException } from '@nestjs/common';
import { Observable } from 'rxjs';
import * as path from 'path';

// Extensiones permitidas
const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'pdf', 'docx', 'xlsx', 'txt'];
// Tamaño máximo en bytes (5MB)
const MAX_SIZE = 5 * 1024 * 1024;

@Injectable()
export class FileValidationInterceptor implements NestInterceptor {
  constructor(
    private readonly allowedExtensions = ALLOWED_EXTENSIONS,
    private readonly maxSize = MAX_SIZE,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    if (!request.file && !request.files) {
      return next.handle();
    }

    // Validar un solo archivo
    if (request.file) {
      this.validateFile(request.file);
    }

    // Validar múltiples archivos
    if (request.files) {
      if (Array.isArray(request.files)) {
        request.files.forEach(file => this.validateFile(file));
      } else {
        // Si es un objeto con diferentes campos
        Object.keys(request.files).forEach(key => {
          const files = request.files[key];
          if (Array.isArray(files)) {
            files.forEach(file => this.validateFile(file));
          } else {
            this.validateFile(files);
          }
        });
      }
    }

    return next.handle();
  }

  private validateFile(file: any): void {
    // Validar tamaño
    if (file.size > this.maxSize) {
      throw new BadRequestException(`El archivo ${file.originalname} supera el tamaño máximo permitido (5MB)`);
    }

    // Validar extensión
    const extension = path.extname(file.originalname).toLowerCase().substring(1);
    if (!this.allowedExtensions.includes(extension)) {
      throw new BadRequestException(
        `Extensión de archivo no permitida. Use: ${this.allowedExtensions.join(', ')}`,
      );
    }

    // Validar MIME type
    // Se podría agregar una validación más estricta según el tipo de archivo
    if (!file.mimetype.match(/\/(jpeg|jpg|png|pdf|vnd.openxmlformats-officedocument|plain)/)) {
      throw new BadRequestException('Tipo de archivo no válido');
    }
  }
}
