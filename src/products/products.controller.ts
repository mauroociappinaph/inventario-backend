import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Req } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';
import { Types } from 'mongoose';
// Extiende la interfaz Request de Express para incluir la propiedad `user`
interface AuthenticatedRequest extends Request {
  user: { userId: Types.ObjectId }; // Define el tipo de `user`
}

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // Solo usuarios autenticados pueden crear productos.
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createProductDto: CreateProductDto, @Req() req: AuthenticatedRequest) {
    // Extrae el usuario autenticado (lo que se devolvió en JwtStrategy)
    const user = req.user; // No es necesario el type assertion ahora
    // Pasa el ID del usuario al DTO o directamente al servicio para asociar el producto.
    return this.productsService.create({
      ...createProductDto,
        userId: new Types.ObjectId(user.userId), // Convert the string to ObjectId
    });
  }

  // Los demás endpoints permanecen igual...
  @Get()
  async findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
