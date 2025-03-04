import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Put, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Protege los endpoints con autenticación
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { InventoryService } from './inventory.service';

@ApiTags('Inventario')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // Registra un nuevo movimiento de inventario.
  @ApiOperation({ summary: 'Registrar un nuevo movimiento de inventario' })
  @ApiResponse({ status: 201, description: 'Movimiento registrado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createInventoryDto: CreateInventoryDto) {
    try {
      console.log('[InventoryController] 📥 Recibiendo solicitud de nuevo movimiento:', createInventoryDto);

      const result = await this.inventoryService.create(createInventoryDto);

      console.log('[InventoryController] ✅ Movimiento registrado:', result);

      return {
        status: 'success',
        message: 'Movimiento registrado exitosamente',
        data: result
      };
    } catch (error) {
      console.error('[InventoryController] ❌ Error al registrar movimiento:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException({
        status: 'error',
        message: error.message || 'Error al registrar movimiento',
      }, HttpStatus.BAD_REQUEST);
    }
  }

  // Obtiene todos los movimientos de inventario con el nombre del producto asociado.
  @ApiOperation({ summary: 'Obtener todos los movimientos de inventario' })
  @ApiResponse({ status: 200, description: 'Listado de movimientos de inventario' })
  @Get()
  async findAll() {
    try {
      console.log('[InventoryController] 📊 Solicitando lista de movimientos');

      const movements = await this.inventoryService.findAll();

      console.log('[InventoryController] ✅ Movimientos obtenidos:', movements.length);

      return {
        status: 'success',
        data: movements
      };
    } catch (error) {
      console.error('[InventoryController] ❌ Error al obtener movimientos:', error);
      throw new HttpException({
        status: 'error',
        message: 'Error al obtener movimientos',
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Obtiene estadísticas detalladas del inventario.
  @ApiOperation({ summary: 'Obtener estadísticas del inventario' })
  @ApiResponse({ status: 200, description: 'Estadísticas obtenidas correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('statistics')
  async getStatistics(@Request() req) {
    console.log('[InventoryController] 📊 Usuario solicitando estadísticas:', req.user?.userId);

    try {
      const stats = await this.inventoryService.getInventoryStatistics(req.user?.userId);
      console.log('[InventoryController] ✅ Estadísticas obtenidas:', stats);
      return stats;
    } catch (error) {
      console.error('[InventoryController] ❌ Error obteniendo estadísticas:', error);
      throw error;
    }
  }

  // Obtiene estadísticas específicas de ROI.
  @ApiOperation({ summary: 'Obtener estadísticas de ROI en el inventario' })
  @ApiResponse({ status: 200, description: 'Estadísticas de ROI obtenidas correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('statistics/roi')
  async getRoiStatistics(@Request() req) {
    console.log('[InventoryController] 📊 Usuario solicitando ROI:', req.user?.userId);

    try {
      const stats = await this.inventoryService.getInventoryStatistics(req.user?.userId);
      console.log('[InventoryController] ✅ ROI obtenido:', stats.roi);
      return { roi: stats.roi || { avgRoi: 0, topRoiProducts: [] } };
    } catch (error) {
      console.error('[InventoryController] ❌ Error obteniendo ROI:', error);
      throw error;
    }
  }

  // Obtiene un movimiento específico de inventario por su ID.
  @ApiOperation({ summary: 'Obtener un movimiento de inventario por ID' })
  @ApiResponse({ status: 200, description: 'Movimiento encontrado' })
  @ApiResponse({ status: 404, description: 'Movimiento no encontrado' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    console.log('[InventoryController] 🔍 Buscando movimiento con ID:', id);

    try {
      const result = await this.inventoryService.findOne(id);
      console.log('[InventoryController] ✅ Movimiento encontrado:', result);
      return result;
    } catch (error) {
      console.error('[InventoryController] ❌ Error al obtener movimiento:', error);
      throw error;
    }
  }

  // Actualiza un movimiento existente en el inventario.
  @ApiOperation({ summary: 'Actualizar un movimiento de inventario' })
  @ApiResponse({ status: 200, description: 'Movimiento actualizado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Movimiento no encontrado' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateInventoryDto: UpdateInventoryDto) {
    console.log('[InventoryController] 🔄 Actualizando movimiento con ID:', id, 'Nuevos datos:', updateInventoryDto);

    try {
      const result = await this.inventoryService.update(id, updateInventoryDto);
      console.log('[InventoryController] ✅ Movimiento actualizado:', result);
      return result;
    } catch (error) {
      console.error('[InventoryController] ❌ Error al actualizar movimiento:', error);
      throw error;
    }
  }

  // Elimina un movimiento de inventario.
  @ApiOperation({ summary: 'Eliminar un movimiento de inventario' })
  @ApiResponse({ status: 200, description: 'Movimiento eliminado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Movimiento no encontrado' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    console.log('[InventoryController] 🗑️ Eliminando movimiento con ID:', id);

    try {
      const result = await this.inventoryService.remove(id);
      console.log('[InventoryController] ✅ Movimiento eliminado:', result);
      return result;
    } catch (error) {
      console.error('[InventoryController] ❌ Error al eliminar movimiento:', error);
      throw error;
    }
  }

  @ApiOperation({ summary: 'Obtener movimientos por ID de producto' })
  @ApiResponse({ status: 200, description: 'Movimientos encontrados' })
  @Get('product/:productId')
  async findByProductId(@Param('productId') productId: string) {
    try {
      console.log('[InventoryController] 🔍 Buscando movimientos del producto:', productId);

      const movements = await this.inventoryService.findByProductId(productId);

      console.log('[InventoryController] ✅ Movimientos encontrados:', movements.length);

      return {
        status: 'success',
        data: movements
      };
    } catch (error) {
      console.error('[InventoryController] ❌ Error al obtener movimientos del producto:', error);
      throw new HttpException({
        status: 'error',
        message: error.message || 'Error al obtener movimientos del producto',
      }, HttpStatus.BAD_REQUEST);
    }
  }
}
