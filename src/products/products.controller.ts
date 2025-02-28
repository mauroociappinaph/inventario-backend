import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Req } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // Este endpoint solo puede ser accedido por usuarios autenticados.
  // El guard 'JwtAuthGuard' verifica que el usuario tenga un token JWT válido.
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createProductDto: CreateProductDto, @Req() req: Request) {
    // Opcional: puedes extraer información del usuario autenticado desde req.user
    // Por ejemplo: const user = req.user;
    return this.productsService.create(createProductDto);
  }

  // Este endpoint es público y permite listar todos los productos.
  @Get()
  async findAll() {
    return this.productsService.findAll();
  }

  // Este endpoint es público y permite obtener un producto por su ID.
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  // Para actualizar un producto, el usuario debe estar autenticado.
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  // Para eliminar un producto, el usuario debe estar autenticado.
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
