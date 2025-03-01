import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model , Types } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  // Inyectamos el modelo de Product para interactuar con MongoDB.
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>
  ) {}

  // Crea un nuevo producto a partir de los datos del DTO.
  async create(createProductDto: CreateProductDto & { userId: Types.ObjectId }): Promise<Product> {
    try {
      const newProduct = new this.productModel(createProductDto);
      return await newProduct.save();
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw new BadRequestException('Datos del producto inválidos');
      }
      throw new InternalServerErrorException('Error al crear el producto');
    }
  }

  // Obtiene todos los productos.
  async findAll(page: number = 1, limit: number = 10): Promise<{products: Product[], total: number, pages: number}> {
    try {
      const skip = (page - 1) * limit;

      const [products, total] = await Promise.all([
        this.productModel.find()
          .skip(skip)
          .limit(limit)
          .exec(),
        this.productModel.countDocuments()
      ]);

      const pages = Math.ceil(total / limit);

      return {
        products,
        total,
        pages
      };
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
  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('ID de producto inválido');
      }
      const updatedProduct = await this.productModel.findByIdAndUpdate(
        id,
        updateProductDto,
        { new: true }
      ).exec();
      if (!updatedProduct) {
        throw new NotFoundException(`Producto con ID ${id} no encontrado`);
      }
      return updatedProduct;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al actualizar el producto');
    }
  }

  // Elimina un producto por su ID. Si no existe, lanza una excepción.
  async remove(id: string): Promise<Product> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('ID de producto inválido');
      }
      const deletedProduct = await this.productModel.findByIdAndDelete(id).exec();
      if (!deletedProduct) {
        throw new NotFoundException(`Producto con ID ${id} no encontrado`);
      }
      return deletedProduct;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al eliminar el producto');
    }
  }
}
