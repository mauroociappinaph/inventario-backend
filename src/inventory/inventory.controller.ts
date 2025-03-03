import { Body, Controller, Delete, Get, Param, Post, Put, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Opcional: puedes proteger algunos endpoints con autenticación
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { InventoryService } from './inventory.service';

@ApiTags('Inventario')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // Registra un nuevo movimiento de inventario.
  // Puedes proteger este endpoint para que solo usuarios autenticados puedan registrar movimientos.
  @ApiOperation({ summary: 'Crear un nuevo movimiento de inventario' })
  @ApiResponse({ status: 201, description: 'Movimiento creado correctamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createInventoryDto: CreateInventoryDto) {
    return this.inventoryService.create(createInventoryDto);
  }

  // Obtiene todos los movimientos de inventario.
  @ApiOperation({ summary: 'Obtener todos los movimientos de inventario' })
  @ApiResponse({ status: 200, description: 'Listado de movimientos' })
  @Get()
  async findAll() {
    return this.inventoryService.findAll();
  }

  // Obtiene estadísticas detalladas del inventario
  @Get('statistics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtiene estadísticas detalladas del inventario' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas de inventario obtenidas correctamente'
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado - Se requiere autenticación'
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor'
  })
  getStatistics(@Request() req) {
    console.log('[InventoryController] 👤 Usuario solicitante:', req.user?.userId);
    return this.inventoryService.getInventoryStatistics(req.user?.userId);
  }

  // Ruta específica para estadísticas de ROI
  @Get('statistics/roi')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtiene estadísticas específicas de ROI' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas de ROI obtenidas correctamente'
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado - Se requiere autenticación'
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor'
  })
  async getRoiStatistics(@Request() req) {
    console.log('[InventoryController] 📊 Solicitud de estadísticas de ROI recibida');
    console.log('[InventoryController] 👤 Usuario solicitante:', req.user?.userId);
    try {
      const stats = await this.inventoryService.getInventoryStatistics(req.user?.userId);

      console.log('[InventoryController] ✅ Estadísticas completas obtenidas:', JSON.stringify(stats, null, 2));

      if (stats.roi) {
        console.log('[InventoryController] 📈 ROI promedio:', stats.roi.avgRoi);
        console.log('[InventoryController] 🔍 Productos con mejor ROI:', stats.roi.topRoiProducts ? stats.roi.topRoiProducts.length : 0);
      } else {
        console.warn('[InventoryController] ⚠️ No se encontró información de ROI en las estadísticas');
      }

      return {
        roi: stats.roi || { avgRoi: 0, topRoiProducts: [] }
      };
    } catch (error) {
      console.error('[InventoryController] ❌ Error al obtener estadísticas de ROI:', error);
      throw error;
    }
  }

  // Obtiene un movimiento por su ID.
  @ApiOperation({ summary: 'Obtener un movimiento de inventario por ID' })
  @ApiResponse({ status: 200, description: 'Movimiento encontrado' })
  @ApiResponse({ status: 404, description: 'Movimiento no encontrado' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.inventoryService.findOne(id);
  }

  // Actualiza un movimiento de inventario.
  @ApiOperation({ summary: 'Actualizar un movimiento de inventario' })
  @ApiResponse({ status: 200, description: 'Movimiento actualizado' })
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
  @ApiResponse({ status: 200, description: 'Movimiento eliminado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Movimiento no encontrado' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.inventoryService.remove(id);
  }
}
