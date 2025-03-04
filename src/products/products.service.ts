import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product, ProductDocument } from './schemas/product.schema';

@Injectable()
export class ProductsService {
  constructor(@InjectModel(Product.name) private productModel: Model<ProductDocument>) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    try {
      if (createProductDto.stock < 0) {
        throw new BadRequestException('El stock inicial no puede ser negativo');
      }

      const newProduct = new this.productModel({
        ...createProductDto,
        lastStockUpdate: new Date()
      });
      return await newProduct.save();
    } catch (error) {
      throw new InternalServerErrorException('Error al crear el producto');
    }
  }

  async findAll(userId: string, page: number = 1, limit: number = 10): Promise<{ products: Product[]; total: number; pages: number }> {
    try {
      const skip = (page - 1) * limit;
      const filter = { userId: new Types.ObjectId(userId) };

      const [products, total] = await Promise.all([
        this.productModel.find(filter)
          .populate('categoryId', 'name')
          .populate('supplierId', 'name')
          .skip(skip)
          .limit(limit)
          .exec(),
        this.productModel.countDocuments(filter)
      ]);

      return { products, total, pages: Math.ceil(total / limit) };
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener los productos');
    }
  }

async findOne(id: string): Promise<Product> {
  if (!Types.ObjectId.isValid(id)) {
    throw new BadRequestException('ID de producto inválido');
  }

  const product = await this.productModel.findById(id)
    .populate('categoryId', 'name')
    .populate('supplierId', 'name')
    .exec();

  if (!product) {
    throw new NotFoundException(`Producto con ID ${id} no encontrado`);
  }

  return product as Product;
}

  async update(id: string, updateProductDto: UpdateProductDto, userId: string): Promise<Product> {
    try {
      const product = await this.findOne(id);

      if (product.userId.toString() !== userId) {
        throw new UnauthorizedException('No tienes permiso para modificar este producto');
      }

      if (updateProductDto.stock !== undefined && updateProductDto.stock < 0) {
        throw new BadRequestException('El stock no puede ser negativo');
      }

      const updatedProduct = await this.productModel.findByIdAndUpdate(
        id,
        { ...updateProductDto, lastStockUpdate: new Date() },
        { new: true }
      ).populate('categoryId', 'name')
        .populate('supplierId', 'name')
        .exec();

      if (!updatedProduct) {
        throw new NotFoundException(`Producto con ID ${id} no encontrado`);
      }

      return updatedProduct;
    } catch (error) {
      throw new InternalServerErrorException('Error al actualizar el producto');
    }
  }

  async remove(id: string, userId: string): Promise<Product> {
    try {
      const product = await this.findOne(id);

      if (product.userId.toString() !== userId) {
        throw new UnauthorizedException('No tienes permiso para eliminar este producto');
      }

      const deletedProduct = await this.productModel.findByIdAndDelete(id)
        .populate('categoryId', 'name')
        .populate('supplierId', 'name')
        .exec();

      if (!deletedProduct) {
        throw new NotFoundException(`Producto con ID ${id} no encontrado`);
      }

      return deletedProduct;
    } catch (error) {
      throw new InternalServerErrorException('Error al eliminar el producto');
    }
  }

  async updateStock(id: string, quantity: number, userId: string): Promise<Product> {
    try {
      const product = await this.findOne(id);
      if (product.userId.toString() !== userId) {
        throw new UnauthorizedException('No tienes permiso para modificar este producto');
      }
      const newStock = product.stock + quantity;
      if (newStock < 0) {
        throw new BadRequestException('No hay suficiente stock disponible');
      }
      return this.update(id, { stock: newStock }, userId);
    } catch (error) {
      throw new InternalServerErrorException('Error al actualizar el stock');
    }
  }

  async getProductStatistics(userId: string) {
    try {
      // Obtener todos los productos del usuario
      const products = await this.productModel.find({ userId: new Types.ObjectId(userId) });

      // Calcular estadísticas
      const totalProducts = products.length;
      const lowStockProducts = products.filter(p => p.stock <= (p.minStock || 0)).length;
      const outOfStockProducts = products.filter(p => p.stock === 0).length;
      const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
      const inventoryValue = products.reduce((sum, p) => sum + (p.stock * (p.price || 0)), 0);

      return {
        totalProducts,
        lowStockProducts,
        outOfStockProducts,
        totalStock,
        inventoryValue,
        criticalStockPercentage: totalProducts > 0 ? (lowStockProducts / totalProducts) * 100 : 0
      };
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener estadísticas de productos');
    }
  }
}
