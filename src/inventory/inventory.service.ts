import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { Stock, StockDocument } from '../stock/schema/stock.schema';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { Inventory, InventoryDocument } from './schemas/inventory.schema';

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(Inventory.name) private inventoryModel: Model<InventoryDocument>,
    @InjectModel(Stock.name) private stockModel: Model<StockDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async create(createInventoryDto: CreateInventoryDto): Promise<Inventory> {
    const { productId, quantity, type } = createInventoryDto;

    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('ID de producto inválido');
    }

    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException(`Producto con ID ${productId} no encontrado`);
    }

    if (type === 'salida') {
      const stock = await this.stockModel.findOne({ productId });
      if (!stock || stock.currentStock < quantity) {
        throw new BadRequestException('No hay suficiente stock disponible');
      }
    }

    const movement = new this.inventoryModel(createInventoryDto);
    await movement.save();

    const stockChange = type === 'entrada' ? quantity : -quantity;
    await this.stockModel.findOneAndUpdate(
      { productId },
      { $inc: { currentStock: stockChange } },
      { new: true, upsert: true }
    );

    return movement;
  }

  async findAll(): Promise<Inventory[]> {
    return this.inventoryModel.find()
      .populate('productId', 'name') // 🔹 Obtener el nombre del producto
      .exec();
  }

  async findOne(id: string): Promise<Inventory> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de movimiento inválido');
    }

    const movement = await this.inventoryModel.findById(id)
      .populate('productId', 'name') // 🔹 Obtener el nombre del producto
      .exec();

    if (!movement) {
      throw new NotFoundException(`Movimiento con id ${id} no encontrado`);
    }
    return movement;
  }

  async update(id: string, updateInventoryDto: UpdateInventoryDto): Promise<Inventory> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de movimiento inválido');
    }

    const updatedMovement = await this.inventoryModel.findByIdAndUpdate(id, updateInventoryDto, { new: true })
      .populate('productId', 'name') // 🔹 Obtener el nombre del producto
      .exec();

    if (!updatedMovement) {
      throw new NotFoundException(`Movimiento con id ${id} no encontrado`);
    }
    return updatedMovement;
  }

  async remove(id: string): Promise<Inventory> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de movimiento inválido');
    }

    const deletedMovement = await this.inventoryModel.findByIdAndDelete(id)
      .populate('productId', 'name') // 🔹 Obtener el nombre del producto
      .exec();

    if (!deletedMovement) {
      throw new NotFoundException(`Movimiento con id ${id} no encontrado`);
    }
    return deletedMovement;
  }

  async getInventoryStatistics(userId: string) {
    try {
      // Validar el userId
      if (!userId || !Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('ID de usuario inválido');
      }

      const userObjectId = new Types.ObjectId(userId);

      // Obtener estadísticas básicas
      const products = await this.productModel.find({ userId: userObjectId }).exec();
      const movements = await this.inventoryModel.find({ userId: userObjectId }).exec();

      // Calcular estadísticas generales
      const totalProducts = products.length;
      const lowStockProducts = products.filter(p => p.stock <= (p.minStock || 0)).length;
      const stockValue = products.reduce((sum, p) => sum + (p.stock * (p.price || 0)), 0);

      // Estadísticas de movimientos
      const entriesCount = movements.filter(m => m.type === 'entry').length;
      const exitsCount = movements.filter(m => m.type === 'exit').length;
      const entriesQuantity = movements
        .filter(m => m.type === 'entry')
        .reduce((sum, m) => sum + m.quantity, 0);
      const exitsQuantity = movements
        .filter(m => m.type === 'exit')
        .reduce((sum, m) => sum + m.quantity, 0);

      // Calcular estadística de ROI simplificada
      // Este es un cálculo básico, se podría mejorar con datos reales de costos
      const avgPrice = products.length > 0
        ? products.reduce((sum, p) => sum + (p.price || 0), 0) / products.length
        : 0;
      const estimatedRoi = avgPrice > 0 ? 15 : 0; // Valor estimado para ejemplo

      return {
        general: {
          totalProducts,
          lowStockProducts,
          stockValue
        },
        movements: {
          total: movements.length,
          entries: entriesQuantity,
          exits: exitsQuantity,
          entriesCount,
          exitsCount
        },
        roi: {
          avgRoi: estimatedRoi,
          topRoiProducts: []
        }
      };
    } catch (error) {
      console.error('[InventoryService] Error al obtener estadísticas:', error);
      throw error;
    }
  }
}
