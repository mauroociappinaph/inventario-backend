import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Supplier, SupplierDocument } from './schemas/supplier.schema';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectModel(Supplier.name) private supplierModel: Model<SupplierDocument>
  ) {}

  async create(createSupplierDto: CreateSupplierDto): Promise<Supplier> {
    try {
      const newSupplier = new this.supplierModel(createSupplierDto);
      return await newSupplier.save();
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw new BadRequestException('Datos del proveedor inválidos');
      }
      throw new InternalServerErrorException('Error al crear el proveedor');
    }
  }

  async findAll(page: number = 1, limit: number = 10): Promise<{suppliers: Supplier[], total: number, pages: number}> {
    try {
      const skip = (page - 1) * limit;

      const [suppliers, total] = await Promise.all([
        this.supplierModel.find()
          .skip(skip)
          .limit(limit)
          .exec(),
        this.supplierModel.countDocuments()
      ]);

      const pages = Math.ceil(total / limit);

      return {
        suppliers,
        total,
        pages
      };
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener los proveedores');
    }
  }

  async findOne(id: string): Promise<Supplier> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('ID de proveedor inválido');
      }
      const supplier = await this.supplierModel.findById(id).exec();
      if (!supplier) {
        throw new NotFoundException(`Proveedor con ID ${id} no encontrado`);
      }
      return supplier;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al buscar el proveedor');
    }
  }

  async update(id: string, updateSupplierDto: UpdateSupplierDto): Promise<Supplier> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('ID de proveedor inválido');
      }
      const updatedSupplier = await this.supplierModel.findByIdAndUpdate(
        id,
        updateSupplierDto,
        { new: true }
      ).exec();
      if (!updatedSupplier) {
        throw new NotFoundException(`Proveedor con ID ${id} no encontrado`);
      }
      return updatedSupplier;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al actualizar el proveedor');
    }
  }

  async remove(id: string): Promise<Supplier> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('ID de proveedor inválido');
      }
      const deletedSupplier = await this.supplierModel.findByIdAndDelete(id).exec();
      if (!deletedSupplier) {
        throw new NotFoundException(`Proveedor con ID ${id} no encontrado`);
      }
      return deletedSupplier;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al eliminar el proveedor');
    }
  }

  // Métodos adicionales específicos
  async findByCategory(category: string): Promise<Supplier[]> {
    return this.supplierModel.find({ categories: category }).exec();
  }

  async findByProduct(productId: string): Promise<Supplier[]> {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('ID de producto inválido');
    }
    return this.supplierModel.find({ products: productId }).exec();
  }

  async addProductToSupplier(supplierId: string, productId: string): Promise<Supplier> {
    if (!Types.ObjectId.isValid(supplierId) || !Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('ID inválido');
    }

    const supplier = await this.supplierModel.findById(supplierId);
    if (!supplier) {
      throw new NotFoundException(`Proveedor con ID ${supplierId} no encontrado`);
    }

    // Verifica si el producto ya está en la lista
    if (!supplier.products.some(id => id.toString() === productId)) {
      const updated = await this.supplierModel.findByIdAndUpdate(
        supplierId,
        { $push: { products: productId } },
        { new: true }
      ).exec();

      if (!updated) {
        throw new NotFoundException(`Error al actualizar el proveedor con ID ${supplierId}`);
      }

      return updated;
    }

    return supplier;
  }

  async removeProductFromSupplier(supplierId: string, productId: string): Promise<Supplier> {
    if (!Types.ObjectId.isValid(supplierId) || !Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('ID inválido');
    }

    const supplier = await this.supplierModel.findById(supplierId);
    if (!supplier) {
      throw new NotFoundException(`Proveedor con ID ${supplierId} no encontrado`);
    }

    const updated = await this.supplierModel.findByIdAndUpdate(
      supplierId,
      { $pull: { products: productId } },
      { new: true }
    ).exec();

    if (!updated) {
      throw new NotFoundException(`Error al actualizar el proveedor con ID ${supplierId}`);
    }

    return updated;
  }
}
