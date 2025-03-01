import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { Inventory, InventorySchema } from './schemas/inventory.schema';
import { Stock, StockSchema } from '../stock/schema/stock.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';

@Module({
  imports: [
    // Registra los esquemas de Inventario, Stock y Products
    MongooseModule.forFeature([
      { name: Inventory.name, schema: InventorySchema },
      { name: Stock.name, schema: StockSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}
