import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    console.log('Servidor funcionando');
    return 'Servidor funcionando';
  }
}
