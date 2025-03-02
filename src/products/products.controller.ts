import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Req, Query, UnauthorizedException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';
import { Types } from 'mongoose';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';

// Extiende la interfaz Request para incluir la propiedad `user`
interface AuthenticatedRequest extends Request {
  user: { userId: Types.ObjectId }; // El objeto user contiene el userId ya tipado
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
    console.log('Datos recibidos:', JSON.stringify(createProductDto, null, 2));
    console.log('Usuario:', JSON.stringify(req.user, null, 2));
    // Extrae el usuario autenticado (proporcionado por la estrategia JWT)
    const user = req.user;
    // Se agrega el ID del usuario al DTO para asociarlo al producto
    return this.productsService.create({
      ...createProductDto,
      userId: new Types.ObjectId(user.userId) // Aseguramos que sea un ObjectId
    });
  }

  // Obtiene todos los productos con paginación.
  @ApiOperation({ summary: 'Obtener todos los productos' })
  @ApiResponse({ status: 200, description: 'Listado de productos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(
    @Req() request: AuthenticatedRequest,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ) {
    const user = request.user;
    if (!user || !user.userId) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    return this.productsService.findAll(user.userId.toString(), page, limit);
  }

  // Endpoint para obtener estadísticas detalladas de productos.
  @ApiOperation({ summary: 'Obtiene estadísticas detalladas de productos' })
  @ApiResponse({ status: 200, description: 'Estadísticas de productos obtenidas correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado - Se requiere autenticación' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('stats')
  async getStatistics(@Req() req: AuthenticatedRequest) {
    return this.productsService.getProductStatistics(req.user.userId.toString());
  }

  // Obtiene un producto por su ID.
  @ApiOperation({ summary: 'Obtener un producto por ID' })
  @ApiParam({ name: 'id', description: 'ID del producto' })
  @ApiResponse({ status: 200, description: 'Producto encontrado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  // Actualiza un producto existente.
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
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.productsService.update(id, updateProductDto, req.user.userId.toString());
  }

  // Elimina un producto por su ID.
  @ApiOperation({ summary: 'Eliminar un producto' })
  @ApiParam({ name: 'id', description: 'ID del producto' })
  @ApiResponse({ status: 200, description: 'Producto eliminado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest
  ) {
    return this.productsService.remove(id, req.user.userId.toString());
  }
}
