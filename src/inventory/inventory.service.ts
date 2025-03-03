import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { Stock, StockDocument } from '../stock/schema/stock.schema';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { Inventory, InventoryDocument } from './schemas/inventory.schema';

@Injectable()
export class InventoryService {
  // Inyecta el modelo de Inventario y el modelo de Stock.
  constructor(
    @InjectModel(Inventory.name) private inventoryModel: Model<InventoryDocument>,
    @InjectModel(Stock.name) private stockModel: Model<StockDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
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

  // Obtiene estadísticas de inventario
  async getInventoryStatistics(userId?: string): Promise<any> {
    try {
      console.log('Iniciando cálculo de estadísticas de inventario mejoradas');
      console.log('ID de usuario para filtrar:', userId || 'No se especificó (mostrando todos)');

      // Fechas para análisis de tendencias
      const currentDate = new Date();
      const thirtyDaysAgo = new Date(currentDate);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const sixtyDaysAgo = new Date(currentDate);
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      // Crear el filtro de usuario si se especificó
      const userFilter = userId ? { userId: new Types.ObjectId(userId) } : {};
      console.log('Filtro de usuario aplicado:', userFilter);

      // Obtener estadísticas básicas
      const [
        totalProducts,
        activeProducts,
        lowStockProducts,
        stockValueData
      ] = await Promise.all([
        this.productModel.countDocuments().exec(),
        this.productModel.countDocuments({ status: 'activo' }).exec(),
        this.productModel.countDocuments({
          $expr: { $lt: ['$stock', '$minStock'] }
        }).exec(),
        this.stockModel.aggregate([
          {
            $lookup: {
              from: 'products',
              localField: 'productId',
              foreignField: '_id',
              as: 'productInfo'
            }
          },
          { $unwind: { path: '$productInfo', preserveNullAndEmptyArrays: true } },
          {
            $group: {
              _id: null,
              totalValue: {
                $sum: {
                  $multiply: [
                    { $ifNull: ['$productInfo.price', 0] },
                    '$currentStock'
                  ]
                }
              }
            }
          }
        ]).exec()
      ]);

      // Obtener estadísticas de movimientos en los últimos 30 días
      const movementStats = await this.inventoryModel.aggregate([
        {
          $match: {
            date: { $gte: thirtyDaysAgo },
            ...userFilter
          }
        },
        {
          $group: {
            _id: null,
            totalMovements: { $sum: 1 },
            entriesCount: {
              $sum: {
                $cond: [{ $eq: ['$type', 'entrada'] }, 1, 0]
              }
            },
            exitsCount: {
              $sum: {
                $cond: [{ $eq: ['$type', 'salida'] }, 1, 0]
              }
            },
            transfersCount: {
              $sum: {
                $cond: [{ $eq: ['$type', 'transferencia'] }, 1, 0]
              }
            },
            totalQuantityMoved: { $sum: '$quantity' }
          }
        }
      ]).exec();

      // Cálculo del ROI promedio
      console.log('[InventoryService] 🔍 Iniciando cálculo de ROI con datos de los últimos 30 días');
      console.log('[InventoryService] 📅 Fecha de inicio para cálculo de ROI:', thirtyDaysAgo);
      console.log('[InventoryService] 👤 Filtro de usuario para ROI:', userFilter);

      const roiData = await this.inventoryModel.aggregate([
        {
          $match: {
            type: 'salida',
            date: { $gte: thirtyDaysAgo },
            ...userFilter
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: 'productId',
            foreignField: '_id',
            as: 'productInfo'
          }
        },
        { $unwind: '$productInfo' },
        {
          $group: {
            _id: '$productId',
            productName: { $first: '$productInfo.name' },
            totalSalidas: { $sum: '$quantity' },
            totalValorSalidas: {
              $sum: {
                $multiply: ['$quantity', '$productInfo.price']
              }
            },
            costoPromedio: { $first: { $ifNull: ['$productInfo.cost', { $multiply: ['$productInfo.price', 0.5] }] } }
          }
        },
        {
          $project: {
            _id: 1,
            productName: 1,
            totalSalidas: 1,
            totalValorSalidas: 1,
            costoPromedio: 1,
            roi: {
              $cond: [
                { $gt: ['$costoPromedio', 0] },
                {
                  $multiply: [
                    {
                      $divide: [
                        { $subtract: ['$totalValorSalidas', { $multiply: ['$totalSalidas', '$costoPromedio'] }] },
                        { $multiply: ['$totalSalidas', '$costoPromedio'] }
                      ]
                    },
                    100
                  ]
                },
                0
              ]
            }
          }
        }
      ]).exec();

      console.log('[InventoryService] 📊 Resultados de la agregación para ROI:', JSON.stringify(roiData, null, 2));
      console.log('[InventoryService] 🔢 Número de productos con datos para ROI:', roiData.length);

      // Calcular ROI promedio de todos los productos
      let avgRoi = 0;
      if (roiData.length > 0) {
        const totalRoi = roiData.reduce((sum, product) => sum + product.roi, 0);
        console.log('[InventoryService] 📈 Suma total de ROI de todos los productos:', totalRoi);
        avgRoi = totalRoi / roiData.length;
        console.log('[InventoryService] 📈 ROI promedio calculado:', avgRoi);
      } else {
        console.warn('[InventoryService] ⚠️ No hay datos suficientes para calcular el ROI');
      }

      // Si no tenemos datos de ROI, verificamos si hay movimientos en general
      const totalMovementsCount = await this.inventoryModel.countDocuments(userFilter);
      console.log('[InventoryService] 📦 Total de movimientos en el sistema (con filtro):', totalMovementsCount);

      const salesMovementsCount = await this.inventoryModel.countDocuments({
        type: 'salida',
        ...userFilter
      });
      console.log('[InventoryService] 🛒 Total de movimientos de salida (con filtro):', salesMovementsCount);

      // Ordenar productos por ROI para obtener los de mejor desempeño
      roiData.sort((a, b) => b.roi - a.roi);
      const topRoiProducts = roiData.slice(0, 5); // Tomar los 5 mejores

      if (topRoiProducts.length > 0) {
        console.log('[InventoryService] 🏆 Productos con mejor ROI:',
          topRoiProducts.map(p => `${p.productName}: ${p.roi.toFixed(2)}%`).join(', '));
      }

      // Obtener datos del período anterior para comparación (31-60 días atrás)
      const previousPeriodStats = await this.inventoryModel.aggregate([
        {
          $match: {
            date: {
              $gte: sixtyDaysAgo,
              $lt: thirtyDaysAgo
            },
            ...userFilter
          }
        },
        {
          $group: {
            _id: null,
            totalMovements: { $sum: 1 },
            entriesCount: {
              $sum: {
                $cond: [{ $eq: ['$type', 'entrada'] }, 1, 0]
              }
            },
            exitsCount: {
              $sum: {
                $cond: [{ $eq: ['$type', 'salida'] }, 1, 0]
              }
            },
            totalQuantityMoved: { $sum: '$quantity' }
          }
        }
      ]).exec();

      // Obtener los 5 productos con más movimientos
      const topMovedProducts = await this.inventoryModel.aggregate([
        {
          $match: {
            date: { $gte: thirtyDaysAgo },
            ...userFilter
          }
        },
        {
          $group: {
            _id: '$productId',
            totalQuantity: { $sum: '$quantity' },
            entriesCount: {
              $sum: {
                $cond: [{ $eq: ['$type', 'entrada'] }, '$quantity', 0]
              }
            },
            exitsCount: {
              $sum: {
                $cond: [{ $eq: ['$type', 'salida'] }, '$quantity', 0]
              }
            }
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'productInfo'
          }
        },
        { $unwind: '$productInfo' },
        {
          $project: {
            _id: 1,
            productName: '$productInfo.name',
            totalQuantity: 1,
            entriesCount: 1,
            exitsCount: 1
          }
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 5 }
      ]).exec();

      // Obtener stock por categoría
      const stockByCategory = await this.stockModel.aggregate([
        {
          $lookup: {
            from: 'products',
            localField: 'productId',
            foreignField: '_id',
            as: 'productInfo'
          }
        },
        { $unwind: '$productInfo' },
        {
          $group: {
            _id: '$productInfo.category',
            itemCount: { $sum: 1 },
            totalStock: { $sum: '$currentStock' },
            totalValue: {
              $sum: {
                $multiply: ['$productInfo.price', '$currentStock']
              }
            }
          }
        },
        {
          $project: {
            category: { $ifNull: ['$_id', 'Sin categoría'] },
            itemCount: 1,
            totalStock: 1,
            totalValue: 1,
            _id: 0
          }
        },
        { $sort: { totalStock: -1 } }
      ]).exec();

      // Predicción de productos que necesitarán reabastecimiento pronto
      const reorderPrediction = await this.stockModel.aggregate([
        {
          $lookup: {
            from: 'products',
            localField: 'productId',
            foreignField: '_id',
            as: 'productInfo'
          }
        },
        { $unwind: '$productInfo' },
        {
          $lookup: {
            from: 'inventories',
            let: { productId: '$productId' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$productId', '$$productId'] },
                      { $eq: ['$type', 'salida'] },
                      { $gte: ['$date', thirtyDaysAgo] }
                    ]
                  }
                }
              },
              {
                $group: {
                  _id: null,
                  totalExits: { $sum: '$quantity' },
                  exitCount: { $sum: 1 }
                }
              }
            ],
            as: 'exitInfo'
          }
        },
        { $unwind: { path: '$exitInfo', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            productId: 1,
            productName: '$productInfo.name',
            currentStock: 1,
            minStock: '$productInfo.minStock',
            avgDailyUsage: {
              $cond: [
                { $gt: [{ $ifNull: ['$exitInfo.totalExits', 0] }, 0] },
                { $divide: [{ $ifNull: ['$exitInfo.totalExits', 0] }, 30] },
                0
              ]
            }
          }
        },
        {
          $project: {
            productId: 1,
            productName: 1,
            currentStock: 1,
            minStock: 1,
            avgDailyUsage: 1,
            daysUntilReorder: {
              $cond: [
                { $gt: ['$avgDailyUsage', 0] },
                { $divide: [{ $subtract: ['$currentStock', '$minStock'] }, '$avgDailyUsage'] },
                999 // Valor alto para productos sin uso reciente
              ]
            }
          }
        },
        { $match: { daysUntilReorder: { $lt: 15, $gt: 0 } } }, // Predecir reabastecimiento en los próximos 15 días
        { $sort: { daysUntilReorder: 1 } },
        { $limit: 5 }
      ]).exec();

      // Calcular tendencias comparando con el período anterior
      const currentPeriod = movementStats.length > 0 ? movementStats[0] : {
        totalMovements: 0,
        entriesCount: 0,
        exitsCount: 0,
        transfersCount: 0,
        totalQuantityMoved: 0
      };

      const previousPeriod = previousPeriodStats.length > 0 ? previousPeriodStats[0] : {
        totalMovements: 0,
        entriesCount: 0,
        exitsCount: 0,
        totalQuantityMoved: 0
      };

      // Calcular porcentajes de cambio
      const calculateChange = (current, previous) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };

      const trends = {
        totalMovements: {
          current: currentPeriod.totalMovements,
          previous: previousPeriod.totalMovements,
          percentChange: calculateChange(currentPeriod.totalMovements, previousPeriod.totalMovements)
        },
        entriesCount: {
          current: currentPeriod.entriesCount,
          previous: previousPeriod.entriesCount,
          percentChange: calculateChange(currentPeriod.entriesCount, previousPeriod.entriesCount)
        },
        exitsCount: {
          current: currentPeriod.exitsCount,
          previous: previousPeriod.exitsCount,
          percentChange: calculateChange(currentPeriod.exitsCount, previousPeriod.exitsCount)
        },
        totalQuantityMoved: {
          current: currentPeriod.totalQuantityMoved,
          previous: previousPeriod.totalQuantityMoved,
          percentChange: calculateChange(currentPeriod.totalQuantityMoved, previousPeriod.totalQuantityMoved)
        }
      };

      // Construir respuesta mejorada
      return {
        general: {
          totalProducts,
          activeProducts,
          lowStockProducts,
          stockValue: stockValueData.length > 0 ? stockValueData[0].totalValue : 0
        },
        movement: {
          ...currentPeriod,
          transfersCount: currentPeriod.transfersCount || 0
        },
        trends,
        topMovedProducts,
        stockByCategory,
        predictions: {
          upcomingReorders: reorderPrediction
        },
        roi: {
          avgRoi,
          topRoiProducts: topRoiProducts
        }
      };
    } catch (error) {
      console.error('Error al obtener estadísticas de inventario:', error);
      throw new InternalServerErrorException('Error al obtener estadísticas de inventario');
    }
  }
}
