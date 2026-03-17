import {
  BadRequestException,
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
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { Rol } from '@cospec/shared-types';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ReclamosService } from './reclamos.service';
import { CreateReclamoDto } from './dto/create-reclamo.dto';
import { AsignarTecnicoDto } from './dto/asignar-tecnico.dto';
import { UpdateEstadoDto } from './dto/update-estado.dto';
import { ResolverReclamoDto } from './dto/resolver-reclamo.dto';
import { AddMaterialDto } from './dto/add-material.dto';
import { CreateReclamoMensajeDto } from './dto/create-reclamo-mensaje.dto';
import { FilterReclamosDto } from './dto/filter-reclamos.dto';
import { ExportReclamosDto } from './dto/export-reclamos.dto';
import { MarkReclamoChatReadDto } from './dto/mark-reclamo-chat-read.dto';
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

  @Get('export')
  @Roles(Rol.ADMIN, Rol.OPERADOR)
  @HttpCode(HttpStatus.OK)
  async exportReclamos(@Query() filters: ExportReclamosDto, @Res() res: Response) {
    if (new Date(filters.desde) > new Date(filters.hasta)) {
      throw new BadRequestException('Fecha desde debe ser menor o igual a hasta');
    }

    const buffer = await this.reclamosService.exportReclamos(filters);

    const filename = `reclamos-${filters.desde}_a_${filters.hasta}.xlsx`;

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  }

  @Get('tecnicos/activos')
  @Roles(Rol.ADMIN, Rol.OPERADOR)
  getActiveTecnicos() {
    return this.reclamosService.getActiveTecnicos();
  }

  @Get('operadores/activos')
  @Roles(Rol.ADMIN, Rol.OPERADOR)
  getActiveOperadores() {
    return this.reclamosService.getActiveOperadores();
  }

  @Get('categorias')
  @Roles(Rol.ADMIN, Rol.OPERADOR)
  getCategoriasActivas() {
    return this.reclamosService.getCategoriasActivas();
  }

  @Get(':id/timeline')
  getTimeline(@Param('id') id: string, @CurrentUser() user: Usuario) {
    return this.reclamosService.getTimeline(id, user.rol as Rol, user.id);
  }

  @Get(':id/chat')
  @Roles(Rol.ADMIN, Rol.OPERADOR, Rol.TECNICO)
  getChat(@Param('id') id: string, @CurrentUser() user: Usuario) {
    return this.reclamosService.getChat(id, user.rol as Rol, user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: Usuario) {
    return this.reclamosService.findOne(id, user.rol as Rol, user.id);
  }

  @Patch(':id/asignacion')
  @Roles(Rol.ADMIN, Rol.OPERADOR)
  asignarTecnico(
    @Param('id') id: string,
    @Body() dto: AsignarTecnicoDto,
    @CurrentUser() user: Usuario,
  ) {
    return this.reclamosService.asignarTecnico(id, dto, user.id);
  }

  @Patch(':id/tomar')
  @Roles(Rol.TECNICO)
  tomar(@Param('id') id: string, @CurrentUser() user: Usuario) {
    return this.reclamosService.tomar(id, user.id);
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
  cancelar(@Param('id') id: string, @CurrentUser() user: Usuario) {
    return this.reclamosService.cancelar(id, user.id);
  }

  @Post(':id/materiales')
  @Roles(Rol.ADMIN, Rol.TECNICO)
  addMaterial(@Param('id') id: string, @Body() dto: AddMaterialDto, @CurrentUser() user: Usuario) {
    return this.reclamosService.addMaterial(id, dto, user.id);
  }

  @Post(':id/chat')
  @Roles(Rol.ADMIN, Rol.OPERADOR, Rol.TECNICO)
  createChatMessage(
    @Param('id') id: string,
    @Body() dto: CreateReclamoMensajeDto,
    @CurrentUser() user: Usuario,
  ) {
    return this.reclamosService.createChatMessage(id, dto, user.rol as Rol, user.id);
  }

  @Post(':id/chat/read')
  @Roles(Rol.ADMIN, Rol.OPERADOR, Rol.TECNICO)
  markChatRead(
    @Param('id') id: string,
    @Body() _dto: MarkReclamoChatReadDto,
    @CurrentUser() user: Usuario,
  ) {
    return this.reclamosService.markChatRead(id, user.rol as Rol, user.id);
  }
}
