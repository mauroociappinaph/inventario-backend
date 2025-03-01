import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Req } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';
import { Types } from 'mongoose';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
// Extiende la interfaz Request de Express para incluir la propiedad `user`
interface AuthenticatedRequest extends Request {
  user: { userId: Types.ObjectId }; // Define el tipo de `user`
}

@ApiTags('Productos')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // Solo usuarios autenticados pueden crear productos.
  @ApiOperation({ summary: 'Crear un nuevo producto' })
  @ApiResponse({ status: 201, description: 'Producto creado correctamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiBody({ type: CreateProductDto })
  @ApiBearerAuth()
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
  @ApiOperation({ summary: 'Obtener todos los productos' })
  @ApiResponse({ status: 200, description: 'Listado de productos' })
  @Get()
  async findAll() {
    return this.productsService.findAll();
  }

  // Cambiamos el endpoint de estadísticas para usar una ruta diferente
  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtiene estadísticas detalladas de productos' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas de productos obtenidas correctamente'
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado - Se requiere autenticación'
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor'
  })
  getStatistics() {
    console.log('Endpoint de estadísticas de productos ejecutado');
    return this.productsService.getProductStatistics();
  }

  @ApiOperation({ summary: 'Obtener un producto por ID' })
  @ApiParam({ name: 'id', description: 'ID del producto' })
  @ApiResponse({ status: 200, description: 'Producto encontrado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    console.log(`Endpoint de producto por ID ejecutado con ID: ${id}`);
    return this.productsService.findOne(id);
  }

  @ApiOperation({ summary: 'Actualizar un producto' })
  @ApiParam({ name: 'id', description: 'ID del producto' })
  @ApiBody({ type: UpdateProductDto })
  @ApiResponse({ status: 200, description: 'Producto actualizado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @ApiOperation({ summary: 'Eliminar un producto' })
  @ApiParam({ name: 'id', description: 'ID del producto' })
  @ApiResponse({ status: 200, description: 'Producto eliminado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
