import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model} from 'mongoose';
import { Inventory, InventoryDocument } from './schemas/inventory.schema';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { Stock, StockDocument } from '../stock/schema/stock.schema';

@Injectable()
export class InventoryService {
  // Inyecta el modelo de Inventario y el modelo de Stock.
  constructor(
    @InjectModel(Inventory.name) private inventoryModel: Model<InventoryDocument>,
    @InjectModel(Stock.name) private stockModel: Model<StockDocument>,
  ) {}

  // Registra un nuevo movimiento en el inventario y actualiza el stock.
  async create(createInventoryDto: CreateInventoryDto): Promise<Inventory> {
    const { productId, quantity, movementType } = createInventoryDto;

    // Si es una salida, verificar que haya suficiente stock
    if (movementType === 'out') {
      const currentStock = await this.stockModel.findOne({ productId });
      if (!currentStock || currentStock.currentStock < quantity) {
        throw new Error('No hay suficiente stock disponible para realizar esta operación');
      }
    }

    // Guarda el movimiento de inventario
    const newMovement = new this.inventoryModel(createInventoryDto);
    const movement = await newMovement.save();

    // Calcula el cambio en el stock: suma si es entrada, resta si es salida
    const change = movementType === 'in' ? quantity : -quantity;

    // Actualiza el documento en la colección de Stock
    // La opción 'upsert: true' crea un registro de stock si no existe
    await this.stockModel.findOneAndUpdate(
      { productId },
      { $inc: { currentStock: change } },
      { new: true, upsert: true }
    );

    return movement;
  }

  // Obtiene todos los movimientos del inventario.
  async findAll(): Promise<Inventory[]> {
    return this.inventoryModel.find().exec();
  }

  // Obtiene un movimiento específico por su ID.
  async findOne(id: string): Promise<Inventory> {
    const movement = await this.inventoryModel.findById(id).exec();
    if (!movement) {
      throw new NotFoundException(`Movimiento con id ${id} no encontrado`);
    }
    return movement;
  }

  // Actualiza un movimiento del inventario.
  async update(id: string, updateInventoryDto: UpdateInventoryDto): Promise<Inventory> {
    const updatedMovement = await this.inventoryModel.findByIdAndUpdate(id, updateInventoryDto, { new: true }).exec();
    if (!updatedMovement) {
      throw new NotFoundException(`Movimiento con id ${id} no encontrado`);
    }
    return updatedMovement;
  }

  // Elimina un movimiento del inventario.
  async remove(id: string): Promise<Inventory> {
    const deletedMovement = await this.inventoryModel.findByIdAndDelete(id).exec();
    if (!deletedMovement) {
      throw new NotFoundException(`Movimiento con id ${id} no encontrado`);
    }
    return deletedMovement;
  }
}
