
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Stock, StockSchema } from '../stock/schema/stock.schema';

@Module({
  imports: [
    // Registra el esquema de Stock para que esté disponible en la aplicación.
    MongooseModule.forFeature([{ name: Stock.name, schema: StockSchema }]),
  ],
  exports: [MongooseModule], // Exporta para que otros módulos puedan usarlo.
})
export class StockModule {}
