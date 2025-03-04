import { Body, Controller, Delete, Get, Param, Post, Put, Request, UseGuards } from '@nestjs/common';
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
    return this.inventoryService.create(createInventoryDto);
  }

  // Obtiene todos los movimientos de inventario con el nombre del producto asociado.
  @ApiOperation({ summary: 'Obtener todos los movimientos de inventario' })
  @ApiResponse({ status: 200, description: 'Listado de movimientos de inventario' })
  @Get()
  async findAll() {
    return this.inventoryService.findAll();
  }

  // Obtiene estadísticas detalladas del inventario.
  @ApiOperation({ summary: 'Obtener estadísticas del inventario' })
  @ApiResponse({ status: 200, description: 'Estadísticas obtenidas correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('statistics')
  getStatistics(@Request() req) {
    console.log('[InventoryController] 📊 Usuario:', req.user?.userId);
    return this.inventoryService.getInventoryStatistics(req.user?.userId);
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
    console.log('[InventoryController] 📊 Solicitud de ROI recibida de:', req.user?.userId);
    try {
      const stats = await this.inventoryService.getInventoryStatistics(req.user?.userId);
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
    return this.inventoryService.findOne(id);
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
    return this.inventoryService.update(id, updateInventoryDto);
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
    return this.inventoryService.remove(id);
  }
}
