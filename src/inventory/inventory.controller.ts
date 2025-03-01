import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Opcional: puedes proteger algunos endpoints con autenticación

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // Registra un nuevo movimiento de inventario.
  // Puedes proteger este endpoint para que solo usuarios autenticados puedan registrar movimientos.
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createInventoryDto: CreateInventoryDto) {
    return this.inventoryService.create(createInventoryDto);
  }

  // Obtiene todos los movimientos de inventario.
  @Get()
  async findAll() {
    return this.inventoryService.findAll();
  }

  // Obtiene un movimiento por su ID.
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.inventoryService.findOne(id);
  }

  // Actualiza un movimiento de inventario.
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateInventoryDto: UpdateInventoryDto) {
    return this.inventoryService.update(id, updateInventoryDto);
  }

  // Elimina un movimiento de inventario.
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.inventoryService.remove(id);
  }
}
