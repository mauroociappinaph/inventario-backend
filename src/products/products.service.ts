import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
  async create(createProductDto: CreateProductDto): Promise<Product> {
    const newProduct = new this.productModel(createProductDto);
    return newProduct.save();
  }

  // Obtiene todos los productos.
  async findAll(): Promise<Product[]> {
    return this.productModel.find().exec();
  }

  // Obtiene un producto por su ID. Si no existe, lanza una excepción.
  async findOne(id: string): Promise<Product> {
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException(`Producto con id ${id} no encontrado`);
    }
    return product;
  }

  // Actualiza un producto existente. Si no se encuentra, lanza una excepción.
  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const updatedProduct = await this.productModel.findByIdAndUpdate(
      id,
      updateProductDto,
      { new: true }
    ).exec();
    if (!updatedProduct) {
      throw new NotFoundException(`Producto con id ${id} no encontrado`);
    }
    return updatedProduct;
  }

  // Elimina un producto por su ID. Si no existe, lanza una excepción.
  async remove(id: string): Promise<Product> {
  const deletedProduct = await this.productModel.findByIdAndDelete(id).exec();
  if (!deletedProduct) {
      throw new NotFoundException(`Producto con id ${id} no encontrado`);
    }
    return deletedProduct;
  }
}
