import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EstadoReclamo, Rol } from '@cospec/shared-types';
import { isValidTransition } from '@cospec/shared-utils';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReclamoDto } from './dto/create-reclamo.dto';
import { UpdateEstadoDto } from './dto/update-estado.dto';
import { ResolverReclamoDto } from './dto/resolver-reclamo.dto';
import { AddMaterialDto } from './dto/add-material.dto';
import { FilterReclamosDto } from './dto/filter-reclamos.dto';
import { Usuario } from '@prisma/client';

@Injectable()
export class ReclamosService {
  constructor(private prisma: PrismaService) {}

  private async generateNumeroReclamo(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.reclamo.count({
      where: {
        createdAt: {
          gte: new Date(`${year}-01-01T00:00:00.000Z`),
          lt: new Date(`${year + 1}-01-01T00:00:00.000Z`),
        },
      },
    });
    const numero = String(count + 1).padStart(3, '0');
    return `REC-${year}-${numero}`;
  }

  async create(dto: CreateReclamoDto, operadorId: string) {
    const numeroReclamo = await this.generateNumeroReclamo();
    const now = new Date();
    const horaRecepcion =
      dto.horaRecepcion ??
      `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    return this.prisma.reclamo.create({
      data: {
        numeroReclamo,
        telefono: dto.telefono,
        nombre: dto.nombre,
        direccion: dto.direccion,
        motivo: dto.motivo,
        servicioAfectado: dto.servicioAfectado,
        horaRecepcion,
        operadorId,
        estado: EstadoReclamo.PENDIENTE,
      },
      include: {
        operador: { select: { id: true, nombre: true, email: true } },
        tecnico: { select: { id: true, nombre: true, email: true } },
        materiales: true,
      },
    });
  }

  async findAll(filters: FilterReclamosDto, userRol: Rol, userId: string) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    // TECNICO solo ve PENDIENTES + sus propios reclamos
    if (userRol === Rol.TECNICO) {
      where['OR'] = [
        { estado: EstadoReclamo.PENDIENTE },
        { tecnicoId: userId },
      ];
    } else {
      if (filters.estado) where['estado'] = filters.estado;
      if (filters.tecnicoId) where['tecnicoId'] = filters.tecnicoId;
    }

    // Filters for all roles
    if (filters.servicioAfectado) where['servicioAfectado'] = filters.servicioAfectado;
    if (filters.desde || filters.hasta) {
      where['fechaRecepcion'] = {
        ...(filters.desde ? { gte: new Date(filters.desde) } : {}),
        ...(filters.hasta ? { lte: new Date(filters.hasta) } : {}),
      };
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.reclamo.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          operador: { select: { id: true, nombre: true } },
          tecnico: { select: { id: true, nombre: true } },
          materiales: true,
        },
      }),
      this.prisma.reclamo.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const reclamo = await this.prisma.reclamo.findUnique({
      where: { id },
      include: {
        operador: { select: { id: true, nombre: true, email: true } },
        tecnico: { select: { id: true, nombre: true, email: true } },
        materiales: true,
      },
    });
    if (!reclamo) throw new NotFoundException(`Reclamo ${id} no encontrado`);
    return reclamo;
  }

  async asignar(id: string, tecnicoId: string) {
    const reclamo = await this.findOne(id);

    if (reclamo.estado === EstadoReclamo.ASIGNADO) {
      throw new ConflictException('El reclamo ya está asignado a un técnico');
    }
    if (reclamo.estado !== EstadoReclamo.PENDIENTE) {
      throw new BadRequestException(
        `No se puede asignar un reclamo en estado ${reclamo.estado}`,
      );
    }

    return this.prisma.reclamo.update({
      where: { id },
      data: {
        estado: EstadoReclamo.ASIGNADO,
        tecnicoId,
        fechaAsignacion: new Date(),
      },
      include: {
        tecnico: { select: { id: true, nombre: true } },
        materiales: true,
      },
    });
  }

  async updateEstado(id: string, dto: UpdateEstadoDto, user: Usuario) {
    const reclamo = await this.findOne(id);

    // Validate state machine transition
    if (!isValidTransition(reclamo.estado as EstadoReclamo, dto.estado)) {
      throw new BadRequestException(
        `Transición inválida: ${reclamo.estado} → ${dto.estado}`,
      );
    }

    // OPERADOR cannot set EN_PROGRESO
    if (
      dto.estado === EstadoReclamo.EN_PROGRESO &&
      user.rol === Rol.OPERADOR
    ) {
      throw new ForbiddenException(
        'El operador no puede cambiar el estado a EN_PROGRESO',
      );
    }

    return this.prisma.reclamo.update({
      where: { id },
      data: { estado: dto.estado },
    });
  }

  async resolver(id: string, dto: ResolverReclamoDto, tecnicoId: string) {
    const reclamo = await this.findOne(id);

    if (reclamo.tecnicoId !== tecnicoId) {
      throw new ForbiddenException('Solo el técnico asignado puede resolver este reclamo');
    }
    if (reclamo.estado !== EstadoReclamo.EN_PROGRESO) {
      throw new BadRequestException(
        'Solo se puede resolver un reclamo EN_PROGRESO',
      );
    }

    const now = new Date();
    const horaAtencion =
      dto.horaAtencion ??
      `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    return this.prisma.$transaction(async (tx) => {
      const resolved = await tx.reclamo.update({
        where: { id },
        data: {
          estado: EstadoReclamo.RESUELTO,
          fallaEncontrada: dto.fallaEncontrada,
          fechaAtencion: now,
          horaAtencion,
        },
      });

      if (dto.materiales && dto.materiales.length > 0) {
        await tx.materialUsado.createMany({
          data: dto.materiales.map((m) => ({
            reclamoId: id,
            descripcion: m.descripcion,
            cantidad: m.cantidad,
          })),
        });
      }

      return tx.reclamo.findUnique({
        where: { id: resolved.id },
        include: { materiales: true },
      });
    });
  }

  async cancelar(id: string) {
    const reclamo = await this.findOne(id);

    if (
      reclamo.estado === EstadoReclamo.RESUELTO ||
      reclamo.estado === EstadoReclamo.CANCELADO
    ) {
      throw new BadRequestException(
        `No se puede cancelar un reclamo en estado ${reclamo.estado}`,
      );
    }

    return this.prisma.reclamo.update({
      where: { id },
      data: { estado: EstadoReclamo.CANCELADO },
    });
  }

  async addMaterial(reclamoId: string, dto: AddMaterialDto) {
    const reclamo = await this.findOne(reclamoId);

    if (
      reclamo.estado === EstadoReclamo.RESUELTO ||
      reclamo.estado === EstadoReclamo.CANCELADO
    ) {
      throw new BadRequestException(
        `No se pueden agregar materiales a un reclamo ${reclamo.estado}`,
      );
    }

    return this.prisma.materialUsado.create({
      data: {
        reclamoId,
        descripcion: dto.descripcion,
        cantidad: dto.cantidad,
      },
    });
  }

  async getStatsByEstado() {
    const stats = await this.prisma.reclamo.groupBy({
      by: ['estado'],
      _count: { estado: true },
    });
    return stats.reduce(
      (acc, s) => ({ ...acc, [s.estado]: s._count.estado }),
      {} as Record<EstadoReclamo, number>,
    );
  }

  async exportReclamos(filters: FilterReclamosDto) {
    // Fetch all (no pagination) for export
    const { data } = await this.findAll({ ...filters, page: 1, limit: 10000 }, Rol.ADMIN, '');

    const rows = data.map((r) => ({
      'N°': r.numeroReclamo,
      'Cliente': r.nombre,
      'Teléfono': r.telefono,
      'Dirección': r.direccion,
      'Servicio': r.servicioAfectado,
      'Estado': r.estado,
      'Fecha Recepción': new Date(r.fechaRecepcion).toLocaleDateString('es-AR'),
      'Hora Recepción': r.horaRecepcion,
      'Técnico': r.tecnico?.nombre ?? '—',
      'Fecha Asignación': r.fechaAsignacion ? new Date(r.fechaAsignacion).toLocaleDateString('es-AR') : '—',
      'Fecha Atención': r.fechaAtencion ? new Date(r.fechaAtencion).toLocaleDateString('es-AR') : '—',
      'Hora Atención': r.horaAtencion ?? '—',
      'Falla Encontrada': r.fallaEncontrada ?? '—',
      'Materiales': r.materiales?.map((m) => `${m.cantidad}x ${m.descripcion}`).join(', ') ?? '—',
    }));

    const XLSX = require('xlsx');
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reclamos');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
  }
}
