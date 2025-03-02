import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  // Inyectamos el modelo de Product para interactuar con MongoDB.
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  // Crea un nuevo product o a partir de los datos del DTO.
  async create(createProductDto: CreateProductDto): Promise<Product> {
    try {
      // Validar que el stock inicial no sea negativo
      if (createProductDto.stock < 0) {
        throw new BadRequestException('El stock inicial no puede ser negativo');
      }

      const newProduct = new this.productModel({
        ...createProductDto,
        lastStockUpdate: new Date()
      });
      return await newProduct.save();
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw new BadRequestException('Datos del producto inválidos');
      }
      throw new InternalServerErrorException('Error al crear el producto');
    }
  }

  // Obtiene todos los productos con paginación.
  async findAll(userId: string, page: number = 1, limit: number = 10): Promise<{ products: Product[]; total: number; pages: number }> {
    try {
      const skip = (page - 1) * limit;
      const filter = { userId: new Types.ObjectId(userId) };

      const [products, total] = await Promise.all([
        this.productModel.find(filter).skip(skip).limit(limit).exec(),
        this.productModel.countDocuments(filter)
      ]);

      const pages = Math.ceil(total / limit);
      return { products, total, pages };
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener los productos');
    }
  }

  // Obtiene un producto por su ID. Si no existe, lanza una excepción.
  async findOne(id: string): Promise<Product> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('ID de producto inválido');
      }
      const product = await this.productModel.findById(id).exec();
      if (!product) {
        throw new NotFoundException(`Producto con ID ${id} no encontrado`);
      }
      return product;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al buscar el producto');
    }
  }

  // Actualiza un producto existente. Si no se encuentra, lanza una excepción.
  async update(id: string, updateProductDto: UpdateProductDto, userId: string): Promise<Product> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('ID de producto inválido');
      }

      const product = await this.findOne(id);

      // Verificar permisos
      if (product.userId.toString() !== userId) {
        throw new UnauthorizedException('No tienes permiso para modificar este producto');
      }

      // Validar stock si se está actualizando
      if (updateProductDto.stock !== undefined && updateProductDto.stock < 0) {
        throw new BadRequestException('El stock no puede ser negativo');
      }

      const updatedProduct = await this.productModel.findByIdAndUpdate(
        id,
        {
          ...updateProductDto,
          lastStockUpdate: updateProductDto.stock !== undefined ? new Date() : undefined
        },
        { new: true }
      ).exec();

      if (!updatedProduct) {
        throw new NotFoundException(`Producto con ID ${id} no encontrado`);
      }
      return updatedProduct;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException || error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al actualizar el producto');
    }
  }

  // Elimina un producto por su ID. Si no existe, lanza una excepción.
  async remove(id: string, userId: string): Promise<Product> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('ID de producto inválido');
      }

      const product = await this.findOne(id);

      // Verificar permisos
      if (product.userId.toString() !== userId) {
        throw new UnauthorizedException('No tienes permiso para eliminar este producto');
      }

      const deletedProduct = await this.productModel.findByIdAndDelete(id).exec();
      if (!deletedProduct) {
        throw new NotFoundException(`Producto con ID ${id} no encontrado`);
      }
      return deletedProduct;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException || error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al eliminar el producto');
    }
  }

  async updateStock(id: string, quantity: number, userId: string): Promise<Product> {
    try {
      const product = await this.findOne(id);

      // Verificar permisos
      if (product.userId.toString() !== userId) {
        throw new UnauthorizedException('No tienes permiso para modificar este producto');
      }

      const newStock = product.stock + quantity;
      if (newStock < 0) {
        throw new BadRequestException('No hay suficiente stock disponible');
      }

      return this.update(id, {
        stock: newStock,
        lastStockUpdate: new Date()
      }, userId);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException || error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al actualizar el stock');
    }
  }

  // Obtiene estadísticas de productos basadas en el esquema actualizado.
  async getProductStatistics(userId: string): Promise<any> {
    try {
      const filter = { userId: new Types.ObjectId(userId) };

      // Total de productos
      const totalProducts = await this.productModel.countDocuments(filter).exec();

      // Productos con stock por debajo del mínimo
      const lowStockProducts = await this.productModel.countDocuments({
        ...filter,
        $expr: { $lt: ["$stock", "$minStock"] }
      }).exec();

      // Valor total del inventario
      const inventoryValueResult = await this.productModel.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalValue: { $sum: { $multiply: ["$price", "$stock"] } }
          }
        }
      ]).exec();

      const inventoryValue = inventoryValueResult.length > 0 ?
        parseFloat(inventoryValueResult[0].totalValue.toFixed(2)) : 0;

      // Distribución por categoría
      const productsByCategory = await this.productModel.aggregate([
        { $match: filter },
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]).exec();

      return {
        summary: {
          totalProducts,
          lowStockProducts,
          inventoryValue
        },
        categoryDistribution: productsByCategory.map(item => ({
          category: item._id,
          count: item.count,
          percentage: totalProducts > 0 ? parseFloat(((item.count / totalProducts) * 100).toFixed(2)) : 0
        }))
      };
    } catch (error) {
      console.error('Error al obtener estadísticas de productos:', error);
      throw new InternalServerErrorException('Error al obtener estadísticas de productos');
    }
  }
}
