import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument, OrderStatus } from './schemas/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto, UpdateOrderStatusDto } from './dto/update-order.dto';
import { ProductsService } from '../products/products.service';
import { SuppliersService } from '../suppliers/suppliers.service';
import { randomUUID } from 'crypto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private readonly productsService: ProductsService,
    private readonly suppliersService: SuppliersService
  ) {}

  async create(createOrderDto: CreateOrderDto, userId: Types.ObjectId): Promise<Order> {
    try {
      // Verificar que el proveedor exista
      await this.suppliersService.findOne(createOrderDto.supplierId.toString());

      // Generar número de orden único
      const orderNumber = `ORD-${Date.now().toString().slice(-8)}-${randomUUID().slice(0, 4)}`;

      // Verificar que los productos existan y validar sus precios
      for (const item of createOrderDto.items) {
        const product = await this.productsService.findOne(item.productId.toString());

        // Opcional: validar que el producto pertenezca al proveedor
        // const suppliers = await this.suppliersService.findByProduct(product._id.toString());
        // if (!suppliers.some(s => s._id.toString() === createOrderDto.supplierId.toString())) {
        //   throw new BadRequestException(`El producto ${product.name} no está asociado al proveedor seleccionado`);
        // }
      }

      // Crear el estado inicial del pedido
      const initialStatus: OrderStatus = {
        status: 'pendiente',
        date: new Date(),
        userId,
        comment: 'Pedido creado'
      };

      // Crear el nuevo pedido
      const newOrder = new this.orderModel({
        ...createOrderDto,
        orderNumber,
        userId,
        orderDate: new Date(),
        currentStatus: 'pendiente',
        statusHistory: [initialStatus]
      });

      return await newOrder.save();
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      if (error.name === 'ValidationError') {
        throw new BadRequestException('Datos del pedido inválidos');
      }
      throw new InternalServerErrorException('Error al crear el pedido');
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    status?: string,
    supplierId?: string
  ): Promise<{orders: Order[], total: number, pages: number}> {
    try {
      const skip = (page - 1) * limit;
      const query: any = {};

      // Aplicar filtros si existen
      if (status) {
        query.currentStatus = status;
      }

      if (supplierId && Types.ObjectId.isValid(supplierId)) {
        query.supplierId = supplierId;
      }

      const [orders, total] = await Promise.all([
        this.orderModel.find(query)
          .sort({ createdAt: -1 }) // Ordenar por fecha de creación, más recientes primero
          .skip(skip)
          .limit(limit)
          .exec(),
        this.orderModel.countDocuments(query)
      ]);

      const pages = Math.ceil(total / limit);

      return {
        orders,
        total,
        pages
      };
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener los pedidos');
    }
  }

  async findOne(id: string): Promise<Order> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('ID de pedido inválido');
      }

      const order = await this.orderModel.findById(id).exec();

      if (!order) {
        throw new NotFoundException(`Pedido con ID ${id} no encontrado`);
      }

      return order;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al buscar el pedido');
    }
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('ID de pedido inválido');
      }

      // Verificar que el pedido exista
      const existingOrder = await this.orderModel.findById(id).exec();
      if (!existingOrder) {
        throw new NotFoundException(`Pedido con ID ${id} no encontrado`);
      }

      // Verificar que el pedido no esté ya en estado "entregado" o "cancelado"
      if (['entregado', 'cancelado'].includes(existingOrder.currentStatus)) {
        throw new BadRequestException(`No se puede actualizar un pedido que ya está ${existingOrder.currentStatus}`);
      }

      // Actualizar el pedido
      const updatedOrder = await this.orderModel.findByIdAndUpdate(
        id,
        updateOrderDto,
        { new: true }
      ).exec();

      if (!updatedOrder) {
        throw new NotFoundException(`Pedido con ID ${id} no encontrado`);
      }

      return updatedOrder;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al actualizar el pedido');
    }
  }

  async remove(id: string): Promise<Order> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('ID de pedido inválido');
      }

      // Verificar que el pedido exista
      const existingOrder = await this.orderModel.findById(id).exec();
      if (!existingOrder) {
        throw new NotFoundException(`Pedido con ID ${id} no encontrado`);
      }

      // Verificar que el pedido no tenga un estado avanzado
      if (!['pendiente', 'confirmado'].includes(existingOrder.currentStatus)) {
        throw new BadRequestException(`No se puede eliminar un pedido en estado ${existingOrder.currentStatus}`);
      }

      const deletedOrder = await this.orderModel.findByIdAndDelete(id).exec();

      if (!deletedOrder) {
        throw new NotFoundException(`Pedido con ID ${id} no encontrado`);
      }

      return deletedOrder;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al eliminar el pedido');
    }
  }

  async updateStatus(id: string, updateStatusDto: UpdateOrderStatusDto): Promise<Order> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('ID de pedido inválido');
      }

      // Verificar que el pedido exista
      const existingOrder = await this.orderModel.findById(id).exec();
      if (!existingOrder) {
        throw new NotFoundException(`Pedido con ID ${id} no encontrado`);
      }

      // Verificar flujo de estados válido
      this.validateStatusTransition(existingOrder.currentStatus, updateStatusDto.status);

      // Crear el nuevo estado para el historial
      const newStatus: OrderStatus = {
        status: updateStatusDto.status,
        date: new Date(),
        userId: updateStatusDto.userId,
        comment: updateStatusDto.comment || `Actualización a estado: ${updateStatusDto.status}`
      };

      // Actualizar el pedido con el nuevo estado y añadir al historial
      const updatedOrder = await this.orderModel.findByIdAndUpdate(
        id,
        {
          currentStatus: updateStatusDto.status,
          $push: { statusHistory: newStatus },
          // Si el estado es "entregado", actualizar la fecha real de entrega
          ...(updateStatusDto.status === 'entregado' ? { actualDeliveryDate: new Date() } : {})
        },
        { new: true }
      ).exec();

      if (!updatedOrder) {
        throw new NotFoundException(`Pedido con ID ${id} no encontrado`);
      }

      return updatedOrder;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al actualizar el estado del pedido');
    }
  }

  // Validar transiciones de estado permitidas
  private validateStatusTransition(currentStatus: string, newStatus: string): void {
    // Definir transiciones válidas para cada estado
    const validTransitions = {
      'pendiente': ['confirmado', 'cancelado'],
      'confirmado': ['en_proceso', 'cancelado'],
      'en_proceso': ['enviado', 'cancelado'],
      'enviado': ['entregado', 'cancelado'],
      'entregado': [], // Estado final, no permite transiciones
      'cancelado': []  // Estado final, no permite transiciones
    };

    // Si el nuevo estado no es una transición válida desde el estado actual
    if (!validTransitions[currentStatus].includes(newStatus) && currentStatus !== newStatus) {
      throw new BadRequestException(
        `Transición de estado inválida: de '${currentStatus}' a '${newStatus}'. ` +
        `Transiciones válidas desde '${currentStatus}': ${validTransitions[currentStatus].join(', ')}`
      );
    }
  }

  // Método para obtener estadísticas de pedidos
  async getOrderStatistics(): Promise<any> {
    const stats = await this.orderModel.aggregate([
      {
        $group: {
          _id: '$currentStatus',
          count: { $sum: 1 },
          totalAmount: { $sum: '$total' }
        }
      }
    ]).exec();

    // Reformatear para mejor uso en el frontend
    const result = {
      totalOrders: 0,
      totalAmount: 0,
      byStatus: {}
    };

    stats.forEach(item => {
      result.totalOrders += item.count;
      result.totalAmount += item.totalAmount;
      result.byStatus[item._id] = {
        count: item.count,
        totalAmount: item.totalAmount
      };
    });

    return result;
  }

  // Método para obtener pedidos por proveedor
  async findBySupplier(supplierId: string): Promise<Order[]> {
    if (!Types.ObjectId.isValid(supplierId)) {
      throw new BadRequestException('ID de proveedor inválido');
    }

    return this.orderModel.find({ supplierId }).sort({ createdAt: -1 }).exec();
  }
}
