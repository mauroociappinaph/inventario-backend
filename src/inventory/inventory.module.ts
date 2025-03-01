import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { Inventory, InventorySchema } from './schemas/inventory.schema';
import { Stock, StockSchema } from '../stock/schema/stock.schema';

@Module({
  imports: [
    // Registra los esquemas de Inventario y Stock.
    MongooseModule.forFeature([
      { name: Inventory.name, schema: InventorySchema },
      { name: Stock.name, schema: StockSchema },
    ]),
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}
