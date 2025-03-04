import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { Product } from '../products/schemas/product.schema';
import { Stock } from '../stock/schema/stock.schema';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { Inventory } from './schemas/inventory.schema';

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(Inventory.name) private readonly inventoryModel: Model<Inventory>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel(Stock.name) private readonly stockModel: Model<Stock>,
    @InjectConnection() private readonly connection: Connection
  ) {}

  async create(createInventoryDto: CreateInventoryDto): Promise<Inventory> {
    const session = await this.connection.startSession();
    let movement = null;

    try {
      await session.withTransaction(async () => {
        const { productId, quantity, type } = createInventoryDto;

        if (!Types.ObjectId.isValid(productId)) {
          throw new BadRequestException('ID de producto inválido');
        }

        // Buscar el producto y su stock actual
        const product = await this.productModel
          .findById(productId)
          .session(session)
          .exec();

        if (!product) {
          throw new NotFoundException(`Producto con ID ${productId} no encontrado`);
        }

        // Verificar stock disponible para salidas
        if (type === 'salida') {
          const currentStock = await this.stockModel
            .findOne({ productId })
            .session(session)
            .exec();

          // Si no existe registro en Stock o hay discrepancia, sincronizar
          if (!currentStock || currentStock.currentStock !== product.stock) {
            await this.syncProductStock(productId.toString());

            // Recargar el stock actualizado
            const updatedStock = await this.stockModel
              .findOne({ productId })
              .session(session)
              .exec();

            if (!updatedStock || updatedStock.currentStock < quantity) {
              throw new BadRequestException(`Stock insuficiente. Disponible: ${updatedStock?.currentStock || 0}`);
            }
          } else if (currentStock.currentStock < quantity) {
            throw new BadRequestException(`Stock insuficiente. Disponible: ${currentStock.currentStock}`);
          }
        }

        // Calcular el nuevo stock
        const stockChange = type === 'entrada' ? quantity : -quantity;
        const newStock = (product.stock || 0) + stockChange;

        if (newStock < 0) {
          throw new BadRequestException('La operación resultaría en stock negativo');
        }

        // Crear y guardar el movimiento
        movement = new this.inventoryModel({
          ...createInventoryDto,
          resultingBalance: newStock,
          date: new Date()
        });
        await movement.save({ session });

        // Actualizar el stock en la colección de Stock
        await this.stockModel.findOneAndUpdate(
          { productId },
          {
            $inc: { currentStock: stockChange },
            $set: { lastUpdate: new Date() }
          },
          {
            new: true,
            upsert: true,
            session
          }
        ).exec();

        // Actualizar el stock en el producto
        await this.productModel.findByIdAndUpdate(
          productId,
          {
            $inc: { stock: stockChange },
            $set: {
              lastStockUpdate: new Date(),
              lastUpdated: new Date()
            }
          },
          { session }
        ).exec();

        console.log(`✅ Movimiento completado: ${type} de ${quantity} unidades. Nuevo stock: ${newStock}`);
      });

      return await this.inventoryModel
        .findById(movement._id)
        .populate('productId', 'name')
        .exec();

    } catch (error) {
      console.error('❌ Error en la transacción:', error);
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async syncProductStock(productId: string): Promise<void> {
    const session = await this.connection.startSession();

    try {
      await session.withTransaction(async () => {
        const product = await this.productModel
          .findById(productId)
          .session(session)
          .exec();

        if (!product) {
          throw new NotFoundException(`Producto con ID ${productId} no encontrado`);
        }

        // Obtener todos los movimientos del producto
        const movements = await this.inventoryModel
          .find({ productId })
          .sort({ date: 1 })
          .session(session)
          .exec();

        // Si no hay movimientos, usar el stock actual del producto
        if (movements.length === 0) {
          await this.stockModel.findOneAndUpdate(
            { productId },
            {
              $set: {
                currentStock: product.stock,
                lastUpdate: new Date()
              }
            },
            { upsert: true, session }
          ).exec();

          console.log(`✅ Stock sincronizado para producto ${productId}. Stock actual: ${product.stock} (sin movimientos)`);
          return;
        }

        // Calcular el stock real basado en los movimientos
        let calculatedStock = product.stock; // Usar el stock del producto como base
        for (const movement of movements) {
          calculatedStock += movement.type === 'entrada' ? movement.quantity : -movement.quantity;
        }

        // Actualizar el stock en ambas colecciones
        await Promise.all([
          this.productModel.findByIdAndUpdate(
            productId,
            {
              $set: {
                stock: calculatedStock,
                lastStockUpdate: new Date(),
                lastUpdated: new Date()
              }
            },
            { session }
          ).exec(),

          this.stockModel.findOneAndUpdate(
            { productId },
            {
              $set: {
                currentStock: calculatedStock,
                lastUpdate: new Date()
              }
            },
            { upsert: true, session }
          ).exec()
        ]);

        console.log(`✅ Stock sincronizado para producto ${productId}. Stock actual: ${calculatedStock}`);
      });
    } catch (error) {
      console.error(`❌ Error al sincronizar stock del producto ${productId}:`, error);
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async findAll(): Promise<Inventory[]> {
    try {
      return await this.inventoryModel
        .find()
        .sort({ date: -1 })
        .populate('productId', 'name')
        .lean()
        .exec();
    } catch (error) {
      console.error('Error al obtener movimientos:', error);
      throw error;
    }
  }

  async findByProductId(productId: string): Promise<Inventory[]> {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('ID de producto inválido');
    }

    try {
      return await this.inventoryModel
        .find({ productId: new Types.ObjectId(productId) })
        .sort({ date: -1 })
        .populate('productId', 'name')
        .lean()
        .exec();
    } catch (error) {
      console.error(`Error al obtener movimientos del producto ${productId}:`, error);
      throw error;
    }
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
      const entriesCount = movements.filter(m => m.type === 'entrada').length;
      const exitsCount = movements.filter(m => m.type === 'salida').length;
      const entriesQuantity = movements
        .filter(m => m.type === 'entrada')
        .reduce((sum, m) => sum + m.quantity, 0);
      const exitsQuantity = movements
        .filter(m => m.type === 'salida')
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
