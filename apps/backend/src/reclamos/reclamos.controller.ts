import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Rol } from '@cospec/shared-types';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ReclamosService } from './reclamos.service';
import { CreateReclamoDto } from './dto/create-reclamo.dto';
import { UpdateEstadoDto } from './dto/update-estado.dto';
import { ResolverReclamoDto } from './dto/resolver-reclamo.dto';
import { AddMaterialDto } from './dto/add-material.dto';
import { FilterReclamosDto } from './dto/filter-reclamos.dto';
import { Usuario } from '@prisma/client';

@Controller('reclamos')
export class ReclamosController {
  constructor(private reclamosService: ReclamosService) {}

  @Post()
  @Roles(Rol.ADMIN, Rol.OPERADOR)
  create(@Body() dto: CreateReclamoDto, @CurrentUser() user: Usuario) {
    return this.reclamosService.create(dto, user.id);
  }

  @Get()
  findAll(@Query() filters: FilterReclamosDto, @CurrentUser() user: Usuario) {
    return this.reclamosService.findAll(filters, user.rol as Rol, user.id);
  }

  @Get('stats')
  @Roles(Rol.ADMIN, Rol.OPERADOR)
  getStats() {
    return this.reclamosService.getStatsByEstado();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reclamosService.findOne(id);
  }

  @Patch(':id/asignar')
  @Roles(Rol.ADMIN, Rol.TECNICO)
  asignar(@Param('id') id: string, @CurrentUser() user: Usuario) {
    return this.reclamosService.asignar(id, user.id);
  }

  @Patch(':id/estado')
  updateEstado(
    @Param('id') id: string,
    @Body() dto: UpdateEstadoDto,
    @CurrentUser() user: Usuario,
  ) {
    return this.reclamosService.updateEstado(id, dto, user);
  }

  @Patch(':id/resolver')
  @Roles(Rol.ADMIN, Rol.TECNICO)
  resolver(
    @Param('id') id: string,
    @Body() dto: ResolverReclamoDto,
    @CurrentUser() user: Usuario,
  ) {
    return this.reclamosService.resolver(id, dto, user.id);
  }

  @Delete(':id/cancelar')
  @HttpCode(HttpStatus.OK)
  @Roles(Rol.ADMIN, Rol.OPERADOR)
  cancelar(@Param('id') id: string) {
    return this.reclamosService.cancelar(id);
  }

  @Post(':id/materiales')
  @Roles(Rol.ADMIN, Rol.TECNICO)
  addMaterial(@Param('id') id: string, @Body() dto: AddMaterialDto) {
    return this.reclamosService.addMaterial(id, dto);
  }
}
