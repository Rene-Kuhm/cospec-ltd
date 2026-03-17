import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as XLSX from 'xlsx';
import {
  EstadoReclamo,
  GetReclamoChatResponse,
  NotificationMetadata,
  NotificationType,
  ReclamoEventoTipo,
  ReclamoMensaje,
  ReclamoTimelineItem,
  Rol,
} from '@cospec/shared-types';
import { isValidTransition } from '@cospec/shared-utils';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReclamoDto } from './dto/create-reclamo.dto';
import { AsignarTecnicoDto } from './dto/asignar-tecnico.dto';
import { UpdateEstadoDto } from './dto/update-estado.dto';
import { ResolverReclamoDto } from './dto/resolver-reclamo.dto';
import { AddMaterialDto } from './dto/add-material.dto';
import { CreateReclamoMensajeDto } from './dto/create-reclamo-mensaje.dto';
import { FilterReclamosDto } from './dto/filter-reclamos.dto';
import { ExportReclamosDto } from './dto/export-reclamos.dto';
import {
  Prisma,
  ReclamoEvento,
  ReclamoEventoTipo as PrismaReclamoEventoTipo,
  Usuario,
} from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

const reclamoDetailInclude = {
  operador: { select: { id: true, nombre: true, email: true } },
  tecnico: { select: { id: true, nombre: true, email: true } },
  asignadoPor: { select: { id: true, nombre: true, email: true } },
  updatedBy: { select: { id: true, nombre: true, email: true } },
  materiales: true,
} as const;

const reclamoListInclude = {
  operador: { select: { id: true, nombre: true } },
  tecnico: { select: { id: true, nombre: true } },
  asignadoPor: { select: { id: true, nombre: true } },
  updatedBy: { select: { id: true, nombre: true } },
} as const;

const reclamoTimelineInclude = {
  actor: { select: { id: true, nombre: true, email: true } },
} as const;

const reclamoChatInclude = {
  autor: { select: { id: true, nombre: true, rol: true } },
} as const;

type ReclamoTimelineEvent = ReclamoEvento & {
  actor: {
    id: string;
    nombre: string;
    email: string;
  } | null;
};

type ReclamoChatMessageRecord = Prisma.ReclamoMensajeGetPayload<{
  include: typeof reclamoChatInclude & {
    lecturas: {
      where: { usuarioId: string };
      select: { readAt: true };
    };
  };
}>;

type ReclamoEventoPayload = {
  estadoAnterior?: EstadoReclamo;
  estadoNuevo?: EstadoReclamo;
  tecnico?: {
    id: string;
    nombre: string;
  } | null;
  materiales?: Array<{
    descripcion: string;
    cantidad: number;
  }>;
  fallaEncontrada?: string;
};

const ESTADO_LABELS: Record<EstadoReclamo, string> = {
  PENDIENTE: 'Pendiente',
  ASIGNADO: 'Asignado',
  EN_PROGRESO: 'En progreso',
  RESUELTO: 'Resuelto',
  CANCELADO: 'Cancelado',
};

@Injectable()
export class ReclamosService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  private readonly inboxOrderBy: Prisma.ReclamoOrderByWithRelationInput[] = [
    { estado: 'asc' },
    { prioridad: 'desc' },
    { fechaRecepcion: 'asc' },
    { createdAt: 'asc' },
  ];

  private normalizeOptionalText(value?: string): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private getActorDisplayName(actor?: { nombre: string } | null): string {
    return actor?.nombre ?? 'Sistema';
  }

  private getEstadoLabel(estado?: EstadoReclamo): string {
    return estado ? ESTADO_LABELS[estado] : 'Sin estado';
  }

  private parseEventoPayload(payload: Prisma.JsonValue): ReclamoEventoPayload {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return {};
    }

    return payload as unknown as ReclamoEventoPayload;
  }

  private toTimelineItem(evento: ReclamoTimelineEvent): ReclamoTimelineItem {
    const actorNombre = this.getActorDisplayName(evento.actor);
    const payload = this.parseEventoPayload(evento.payload);
    const material = payload.materiales?.[0];

    switch (evento.tipo) {
      case ReclamoEventoTipo.CREADO:
        return {
          id: evento.id,
          tipo: evento.tipo as unknown as ReclamoEventoTipo,
          fecha: evento.createdAt,
          actor: evento.actor,
          titulo: 'Reclamo creado',
          descripcion: `${actorNombre} registro el reclamo y lo dejo en ${this.getEstadoLabel(payload.estadoNuevo ?? EstadoReclamo.PENDIENTE)}.`,
          payload,
        };
      case ReclamoEventoTipo.ASIGNACION_ADMINISTRATIVA:
        return {
          id: evento.id,
          tipo: evento.tipo as unknown as ReclamoEventoTipo,
          fecha: evento.createdAt,
          actor: evento.actor,
          titulo: 'Asignacion administrativa',
          descripcion: `${actorNombre} asigno el reclamo a ${payload.tecnico?.nombre ?? 'un tecnico'}.`,
          payload,
        };
      case ReclamoEventoTipo.TOMADO:
        return {
          id: evento.id,
          tipo: evento.tipo as unknown as ReclamoEventoTipo,
          fecha: evento.createdAt,
          actor: evento.actor,
          titulo: 'Reclamo tomado',
          descripcion: `${actorNombre} tomo el reclamo para atenderlo.`,
          payload,
        };
      case ReclamoEventoTipo.ESTADO_CAMBIADO:
        return {
          id: evento.id,
          tipo: evento.tipo as unknown as ReclamoEventoTipo,
          fecha: evento.createdAt,
          actor: evento.actor,
          titulo: 'Cambio de estado',
          descripcion: `${actorNombre} cambio el estado de ${this.getEstadoLabel(payload.estadoAnterior)} a ${this.getEstadoLabel(payload.estadoNuevo)}.`,
          payload,
        };
      case ReclamoEventoTipo.RESUELTO:
        return {
          id: evento.id,
          tipo: evento.tipo as unknown as ReclamoEventoTipo,
          fecha: evento.createdAt,
          actor: evento.actor,
          titulo: 'Reclamo resuelto',
          descripcion: payload.fallaEncontrada
            ? `${actorNombre} resolvio el reclamo: ${payload.fallaEncontrada}`
            : `${actorNombre} resolvio el reclamo.`,
          payload,
        };
      case ReclamoEventoTipo.CANCELADO:
        return {
          id: evento.id,
          tipo: evento.tipo as unknown as ReclamoEventoTipo,
          fecha: evento.createdAt,
          actor: evento.actor,
          titulo: 'Reclamo cancelado',
          descripcion: `${actorNombre} cancelo el reclamo desde ${this.getEstadoLabel(payload.estadoAnterior)}.`,
          payload,
        };
      case ReclamoEventoTipo.MATERIAL_AGREGADO:
        return {
          id: evento.id,
          tipo: evento.tipo as unknown as ReclamoEventoTipo,
          fecha: evento.createdAt,
          actor: evento.actor,
          titulo: 'Material agregado',
          descripcion: material
            ? `${actorNombre} agrego ${material.cantidad}x ${material.descripcion} al reclamo.`
            : `${actorNombre} agrego materiales al reclamo.`,
          payload,
        };
      default:
        return {
          id: evento.id,
          tipo: evento.tipo as unknown as ReclamoEventoTipo,
          fecha: evento.createdAt,
          actor: evento.actor,
          titulo: 'Evento del reclamo',
          descripcion: `${actorNombre} actualizo el reclamo.`,
          payload,
        };
    }
  }

  private async writeEvento(
    tx: Prisma.TransactionClient,
    input: {
      reclamoId: string;
      tipo: ReclamoEventoTipo;
      actorId?: string | null;
      payload: ReclamoEventoPayload;
    },
  ) {
    return tx.reclamoEvento.create({
      data: {
        reclamoId: input.reclamoId,
        tipo: input.tipo as unknown as PrismaReclamoEventoTipo,
        actorId: input.actorId,
        payload: input.payload as Prisma.InputJsonValue,
      },
    });
  }

  private buildNotificationActor(
    actor?: { id: string; nombre: string; email?: string | null } | null,
  ): NotificationMetadata['actor'] {
    if (!actor) {
      return null;
    }

    return {
      id: actor.id,
      nombre: actor.nombre,
      email: actor.email ?? undefined,
    };
  }

  private async loadUserActor(tx: Prisma.TransactionClient, userId: string) {
    return tx.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nombre: true,
        email: true,
      },
    });
  }

  private getOperativeRecipientIds(reclamo: {
    operadorId: string;
    asignadoPorId?: string | null;
  }): string[] {
    return Array.from(new Set([reclamo.operadorId, reclamo.asignadoPorId].filter(Boolean))) as string[];
  }

  private buildReclamosWhere(
    filters: FilterReclamosDto,
    userRol: Rol,
    userId: string,
  ): Prisma.ReclamoWhereInput {
    const andWhere: Prisma.ReclamoWhereInput[] = [];

    if (userRol === Rol.TECNICO) {
      andWhere.push({
        OR: [{ estado: EstadoReclamo.PENDIENTE }, { tecnicoId: userId }],
      });
    }

    if (filters.search?.trim()) {
      const term = filters.search.trim();
      const digitsOnly = term.replace(/\D/g, '');
      const phoneSearchTerms = Array.from(new Set([term, digitsOnly].filter(Boolean)));

      andWhere.push({
        OR: [
          {
            numeroReclamo: {
              contains: term,
              mode: 'insensitive',
            },
          },
          {
            nombre: {
              contains: term,
              mode: 'insensitive',
            },
          },
          ...phoneSearchTerms.map((value) => ({
            telefono: {
              contains: value,
              mode: 'insensitive' as const,
            },
          })),
        ],
      });
    }

    if (filters.estado) {
      andWhere.push({ estado: filters.estado });
    }

    if (filters.prioridad) {
      andWhere.push({ prioridad: filters.prioridad });
    }

    if (filters.categoria?.trim()) {
      andWhere.push({
        categoria: {
          equals: filters.categoria.trim(),
          mode: 'insensitive',
        },
      });
    }

    if (filters.servicioAfectado) {
      andWhere.push({ servicioAfectado: filters.servicioAfectado });
    }

    if (filters.tecnicoId) {
      andWhere.push({ tecnicoId: filters.tecnicoId });
    }

    if (filters.operadorId) {
      andWhere.push({ operadorId: filters.operadorId });
    }

    if (filters.desde || filters.hasta) {
      andWhere.push({
        fechaRecepcion: {
          ...(filters.desde ? { gte: new Date(filters.desde) } : {}),
          ...(filters.hasta ? { lte: new Date(filters.hasta) } : {}),
        },
      });
    }

    if (andWhere.length === 0) {
      return {};
    }

    return { AND: andWhere };
  }

  private async ensureActiveTecnico(tecnicoId: string) {
    const tecnico = await this.prisma.usuario.findFirst({
      where: {
        id: tecnicoId,
        rol: 'TECNICO',
        activo: true,
      },
      select: { id: true, nombre: true },
    });

    if (!tecnico) {
      throw new BadRequestException('El tecnico seleccionado no existe o no esta activo');
    }

    return tecnico;
  }

  private async ensureChatAccess(reclamoId: string, userRol: Rol, userId: string) {
    const reclamo = await this.prisma.reclamo.findUnique({
      where: { id: reclamoId },
      select: {
        id: true,
        numeroReclamo: true,
        estado: true,
        tecnicoId: true,
        operadorId: true,
        asignadoPorId: true,
      },
    });

    if (!reclamo) {
      throw new NotFoundException(`Reclamo ${reclamoId} no encontrado`);
    }

    if (userRol === Rol.TECNICO && reclamo.tecnicoId !== userId) {
      throw new ForbiddenException('Solo el tecnico asignado puede acceder al chat interno');
    }

    return reclamo;
  }

  private toChatMessage(
    message: ReclamoChatMessageRecord,
    currentUserId: string,
  ): ReclamoMensaje {
    const readAt =
      message.autorId === currentUserId
        ? message.createdAt
        : (message.lecturas[0]?.readAt ?? null);

    return {
      id: message.id,
      reclamoId: message.reclamoId,
      autorId: message.autorId,
      autor: {
        id: message.autor.id,
        nombre: message.autor.nombre,
        rol: message.autor.rol as unknown as Rol,
      },
      contenido: message.contenido,
      createdAt: message.createdAt,
      isRead: message.autorId === currentUserId || Boolean(readAt),
      readAt,
    };
  }

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

    return this.prisma.$transaction(async (tx) => {
      const reclamo = await tx.reclamo.create({
        data: {
          numeroReclamo,
          telefono: dto.telefono,
          nombre: dto.nombre,
          direccion: dto.direccion,
          motivo: dto.motivo,
          servicioAfectado: dto.servicioAfectado,
          prioridad: dto.prioridad ?? 'MEDIA',
          categoria: this.normalizeOptionalText(dto.categoria),
          subcategoria: this.normalizeOptionalText(dto.subcategoria),
          horaRecepcion,
          operadorId,
          updatedById: operadorId,
          estado: EstadoReclamo.PENDIENTE,
        },
      });

      await this.writeEvento(tx, {
        reclamoId: reclamo.id,
        tipo: ReclamoEventoTipo.CREADO,
        actorId: operadorId,
        payload: {
          estadoNuevo: EstadoReclamo.PENDIENTE,
        },
      });

      return tx.reclamo.findUnique({
        where: { id: reclamo.id },
        include: reclamoDetailInclude,
      });
    });
  }

  async findAll(filters: FilterReclamosDto, userRol: Rol, userId: string) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = this.buildReclamosWhere(filters, userRol, userId);

    const [data, total, statsRows] = await this.prisma.$transaction([
      this.prisma.reclamo.findMany({
        where,
        skip,
        take: limit,
        orderBy: this.inboxOrderBy,
        include: reclamoListInclude,
      }),
      this.prisma.reclamo.count({ where }),
      this.prisma.reclamo.groupBy({
        by: ['estado'],
        where,
        orderBy: { estado: 'asc' },
        _count: { _all: true },
      }),
    ]);

    const stats = statsRows.reduce(
      (acc, item) => {
        const totalByEstado =
          typeof item._count === 'object' && item._count ? (item._count._all ?? 0) : 0;

        return {
          ...acc,
          [item.estado]: totalByEstado,
        };
      },
      {} as Partial<Record<EstadoReclamo, number>>,
    );

    return { data, total, page, limit, stats };
  }

  async findOne(id: string, userRol?: Rol, userId?: string) {
    const reclamo = await this.prisma.reclamo.findUnique({
      where: { id },
      include: reclamoDetailInclude,
    });
    if (!reclamo) throw new NotFoundException(`Reclamo ${id} no encontrado`);

    if (
      userRol === Rol.TECNICO &&
      userId &&
      reclamo.estado !== EstadoReclamo.PENDIENTE &&
      reclamo.tecnicoId !== userId
    ) {
      throw new ForbiddenException('No tenes acceso a este reclamo');
    }

    return reclamo;
  }

  async getTimeline(id: string, userRol?: Rol, userId?: string) {
    await this.findOne(id, userRol, userId);

    const eventos = await this.prisma.reclamoEvento.findMany({
      where: { reclamoId: id },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      include: reclamoTimelineInclude,
    });

    return eventos.map((evento) => this.toTimelineItem(evento));
  }

  async getChat(id: string, userRol: Rol, userId: string): Promise<GetReclamoChatResponse> {
    await this.ensureChatAccess(id, userRol, userId);

    const [messages, unreadCount] = await this.prisma.$transaction([
      this.prisma.reclamoMensaje.findMany({
        where: { reclamoId: id },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        include: {
          ...reclamoChatInclude,
          lecturas: {
            where: { usuarioId: userId },
            select: { readAt: true },
          },
        },
      }),
      this.prisma.reclamoMensaje.count({
        where: {
          reclamoId: id,
          autorId: { not: userId },
          lecturas: {
            none: { usuarioId: userId },
          },
        },
      }),
    ]);

    return {
      reclamoId: id,
      messages: messages.map((message) => this.toChatMessage(message, userId)),
      unreadCount,
      canWrite: true,
    };
  }

  async getActiveTecnicos() {
    return this.prisma.usuario.findMany({
      where: {
        rol: 'TECNICO',
        activo: true,
      },
      select: {
        id: true,
        nombre: true,
      },
      orderBy: { nombre: 'asc' },
    });
  }

  async getActiveOperadores() {
    return this.prisma.usuario.findMany({
      where: {
        activo: true,
        rol: {
          in: [Rol.ADMIN, Rol.OPERADOR],
        },
      },
      select: {
        id: true,
        nombre: true,
        rol: true,
      },
      orderBy: [{ rol: 'asc' }, { nombre: 'asc' }],
    });
  }

  async getCategoriasActivas() {
    const categorias = await this.prisma.reclamo.findMany({
      where: {
        categoria: {
          not: null,
        },
      },
      select: {
        categoria: true,
      },
      distinct: ['categoria'],
      orderBy: {
        categoria: 'asc',
      },
    });

    return categorias
      .map((item) => item.categoria?.trim())
      .filter((item): item is string => Boolean(item));
  }

  async asignarTecnico(id: string, dto: AsignarTecnicoDto, assignedById: string) {
    const reclamo = await this.findOne(id);

    const tecnico = await this.ensureActiveTecnico(dto.tecnicoId);

    if (
      reclamo.estado === EstadoReclamo.RESUELTO ||
      reclamo.estado === EstadoReclamo.CANCELADO
    ) {
      throw new BadRequestException(
        `No se puede asignar un reclamo en estado ${reclamo.estado}`,
      );
    }

    if (reclamo.estado === EstadoReclamo.EN_PROGRESO) {
      throw new BadRequestException('No se puede reasignar un reclamo en progreso');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.reclamo.update({
        where: { id },
        data: {
          estado: EstadoReclamo.ASIGNADO,
          tecnicoId: dto.tecnicoId,
          asignadoPorId: assignedById,
          fechaAsignacion: new Date(),
          updatedById: assignedById,
        },
      });

      const actor = await this.loadUserActor(tx, assignedById);
      const evento = await this.writeEvento(tx, {
        reclamoId: id,
        tipo: ReclamoEventoTipo.ASIGNACION_ADMINISTRATIVA,
        actorId: assignedById,
        payload: {
          estadoAnterior: reclamo.estado as EstadoReclamo,
          estadoNuevo: EstadoReclamo.ASIGNADO,
          tecnico: {
            id: tecnico.id,
            nombre: tecnico.nombre,
          },
        },
      });

      await this.notificationsService.createForUsers(tx, {
        actorId: assignedById,
        recipientIds: [dto.tecnicoId],
        type: NotificationType.RECLAMO_ASIGNADO,
        title: `Nuevo reclamo asignado: ${reclamo.numeroReclamo}`,
        message: `${actor?.nombre ?? 'Operaciones'} te asigno el reclamo ${reclamo.numeroReclamo}.`,
        eventId: evento.id,
        reclamo: {
          id: reclamo.id,
          numeroReclamo: reclamo.numeroReclamo,
          estado: EstadoReclamo.ASIGNADO,
        },
        metadata: {
          actor: this.buildNotificationActor(actor),
          tecnico: {
            id: tecnico.id,
            nombre: tecnico.nombre,
          },
          estadoAnterior: reclamo.estado as EstadoReclamo,
          estadoNuevo: EstadoReclamo.ASIGNADO,
        },
      });

      if (reclamo.tecnicoId && reclamo.tecnicoId !== dto.tecnicoId) {
        await this.notificationsService.createForUsers(tx, {
          actorId: assignedById,
          recipientIds: [reclamo.tecnicoId],
          type: NotificationType.CAMBIO_OPERATIVO,
          title: `Reasignacion en ${reclamo.numeroReclamo}`,
          message: `El reclamo ${reclamo.numeroReclamo} fue reasignado a ${tecnico.nombre}.`,
          eventId: `${evento.id}:previous-tech`,
          reclamo: {
            id: reclamo.id,
            numeroReclamo: reclamo.numeroReclamo,
            estado: EstadoReclamo.ASIGNADO,
          },
          metadata: {
            actor: this.buildNotificationActor(actor),
            tecnico: {
              id: tecnico.id,
              nombre: tecnico.nombre,
            },
            estadoAnterior: reclamo.estado as EstadoReclamo,
            estadoNuevo: EstadoReclamo.ASIGNADO,
          },
        });
      }

      return tx.reclamo.findUnique({
        where: { id: updated.id },
        include: reclamoDetailInclude,
      });
    });
  }

  async tomar(id: string, tecnicoId: string) {
    const reclamo = await this.findOne(id);

    if (reclamo.tecnicoId && reclamo.tecnicoId !== tecnicoId) {
      throw new ConflictException('El reclamo ya esta asignado a otro tecnico');
    }
    if (reclamo.estado !== EstadoReclamo.PENDIENTE) {
      throw new BadRequestException(
        `No se puede asignar un reclamo en estado ${reclamo.estado}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.reclamo.update({
        where: { id },
        data: {
          estado: EstadoReclamo.ASIGNADO,
          tecnicoId,
          asignadoPorId: tecnicoId,
          fechaAsignacion: new Date(),
          updatedById: tecnicoId,
        },
      });

      const actor = await this.loadUserActor(tx, tecnicoId);
      const evento = await this.writeEvento(tx, {
        reclamoId: id,
        tipo: ReclamoEventoTipo.TOMADO,
        actorId: tecnicoId,
        payload: {
          estadoAnterior: reclamo.estado as EstadoReclamo,
          estadoNuevo: EstadoReclamo.ASIGNADO,
        },
      });

      await this.notificationsService.createForUsers(tx, {
        actorId: tecnicoId,
        recipientIds: this.getOperativeRecipientIds(reclamo),
        type: NotificationType.CAMBIO_OPERATIVO,
        title: `Reclamo tomado: ${reclamo.numeroReclamo}`,
        message: `${actor?.nombre ?? 'El tecnico'} tomo el reclamo ${reclamo.numeroReclamo}.`,
        eventId: evento.id,
        reclamo: {
          id: reclamo.id,
          numeroReclamo: reclamo.numeroReclamo,
          estado: EstadoReclamo.ASIGNADO,
        },
        metadata: {
          actor: this.buildNotificationActor(actor),
          estadoAnterior: reclamo.estado as EstadoReclamo,
          estadoNuevo: EstadoReclamo.ASIGNADO,
        },
      });

      return tx.reclamo.findUnique({
        where: { id: updated.id },
        include: reclamoDetailInclude,
      });
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

    if (dto.estado === EstadoReclamo.EN_PROGRESO) {
      if (!reclamo.tecnicoId) {
        throw new BadRequestException('El reclamo debe tener un tecnico asignado');
      }

      if (user.rol === Rol.TECNICO && reclamo.tecnicoId !== user.id) {
        throw new ForbiddenException('Solo el tecnico asignado puede iniciar este reclamo');
      }
    }

    if (user.rol === Rol.TECNICO && reclamo.tecnicoId !== user.id) {
      throw new ForbiddenException('Solo el tecnico asignado puede actualizar este reclamo');
    }

    const data: Record<string, unknown> = {
      estado: dto.estado,
      updatedById: user.id,
    };

    if (dto.estado === EstadoReclamo.PENDIENTE) {
      data['tecnicoId'] = null;
      data['fechaAsignacion'] = null;
      data['asignadoPorId'] = null;
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.reclamo.update({
        where: { id },
        data,
      });

      const actor = await this.loadUserActor(tx, user.id);
      const evento = await this.writeEvento(tx, {
        reclamoId: id,
        tipo: ReclamoEventoTipo.ESTADO_CAMBIADO,
        actorId: user.id,
        payload: {
          estadoAnterior: reclamo.estado as EstadoReclamo,
          estadoNuevo: dto.estado,
        },
      });

      if (dto.estado === EstadoReclamo.EN_PROGRESO) {
        await this.notificationsService.createForUsers(tx, {
          actorId: user.id,
          recipientIds: this.getOperativeRecipientIds(reclamo),
          type: NotificationType.CAMBIO_OPERATIVO,
          title: `Trabajo iniciado: ${reclamo.numeroReclamo}`,
          message: `${actor?.nombre ?? 'El tecnico'} inicio la atencion del reclamo ${reclamo.numeroReclamo}.`,
          eventId: evento.id,
          reclamo: {
            id: reclamo.id,
            numeroReclamo: reclamo.numeroReclamo,
            estado: EstadoReclamo.EN_PROGRESO,
          },
          metadata: {
            actor: this.buildNotificationActor(actor),
            estadoAnterior: reclamo.estado as EstadoReclamo,
            estadoNuevo: EstadoReclamo.EN_PROGRESO,
          },
        });
      }

      if (dto.estado === EstadoReclamo.PENDIENTE && reclamo.tecnicoId) {
        await this.notificationsService.createForUsers(tx, {
          actorId: user.id,
          recipientIds: [reclamo.tecnicoId],
          type: NotificationType.CAMBIO_OPERATIVO,
          title: `Reclamo liberado: ${reclamo.numeroReclamo}`,
          message: `El reclamo ${reclamo.numeroReclamo} volvio a pendiente y salio de tu bandeja.`,
          eventId: `${evento.id}:previous-tech`,
          reclamo: {
            id: reclamo.id,
            numeroReclamo: reclamo.numeroReclamo,
            estado: EstadoReclamo.PENDIENTE,
          },
          metadata: {
            actor: this.buildNotificationActor(actor),
            estadoAnterior: reclamo.estado as EstadoReclamo,
            estadoNuevo: EstadoReclamo.PENDIENTE,
          },
        });
      }

      return tx.reclamo.findUnique({
        where: { id: updated.id },
        include: reclamoDetailInclude,
      });
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
          updatedById: tecnicoId,
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

      const actor = await this.loadUserActor(tx, tecnicoId);
      const evento = await this.writeEvento(tx, {
        reclamoId: id,
        tipo: ReclamoEventoTipo.RESUELTO,
        actorId: tecnicoId,
        payload: {
          estadoAnterior: reclamo.estado as EstadoReclamo,
          estadoNuevo: EstadoReclamo.RESUELTO,
          fallaEncontrada: dto.fallaEncontrada,
          materiales: dto.materiales?.map((material) => ({
            descripcion: material.descripcion,
            cantidad: material.cantidad,
          })),
        },
      });

      await this.notificationsService.createForUsers(tx, {
        actorId: tecnicoId,
        recipientIds: this.getOperativeRecipientIds(reclamo),
        type: NotificationType.RECLAMO_RESUELTO,
        title: `Reclamo resuelto: ${reclamo.numeroReclamo}`,
        message: dto.fallaEncontrada
          ? `${actor?.nombre ?? 'El tecnico'} resolvio ${reclamo.numeroReclamo}: ${dto.fallaEncontrada}`
          : `${actor?.nombre ?? 'El tecnico'} resolvio ${reclamo.numeroReclamo}.`,
        eventId: evento.id,
        reclamo: {
          id: reclamo.id,
          numeroReclamo: reclamo.numeroReclamo,
          estado: EstadoReclamo.RESUELTO,
        },
        metadata: {
          actor: this.buildNotificationActor(actor),
          estadoAnterior: reclamo.estado as EstadoReclamo,
          estadoNuevo: EstadoReclamo.RESUELTO,
          motivo: dto.fallaEncontrada,
        },
      });

      return tx.reclamo.findUnique({
        where: { id: resolved.id },
        include: reclamoDetailInclude,
      });
    });
  }

  async cancelar(id: string, updatedById: string) {
    const reclamo = await this.findOne(id);

    if (
      reclamo.estado === EstadoReclamo.RESUELTO ||
      reclamo.estado === EstadoReclamo.CANCELADO
    ) {
      throw new BadRequestException(
        `No se puede cancelar un reclamo en estado ${reclamo.estado}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.reclamo.update({
        where: { id },
        data: {
          estado: EstadoReclamo.CANCELADO,
          updatedById,
        },
      });

      const actor = await this.loadUserActor(tx, updatedById);
      const evento = await this.writeEvento(tx, {
        reclamoId: id,
        tipo: ReclamoEventoTipo.CANCELADO,
        actorId: updatedById,
        payload: {
          estadoAnterior: reclamo.estado as EstadoReclamo,
          estadoNuevo: EstadoReclamo.CANCELADO,
        },
      });

      await this.notificationsService.createForUsers(tx, {
        actorId: updatedById,
        recipientIds: [...this.getOperativeRecipientIds(reclamo), reclamo.tecnicoId ?? ''],
        type: NotificationType.RECLAMO_CANCELADO,
        title: `Reclamo cancelado: ${reclamo.numeroReclamo}`,
        message: `${actor?.nombre ?? 'Operaciones'} cancelo el reclamo ${reclamo.numeroReclamo}.`,
        eventId: evento.id,
        reclamo: {
          id: reclamo.id,
          numeroReclamo: reclamo.numeroReclamo,
          estado: EstadoReclamo.CANCELADO,
        },
        metadata: {
          actor: this.buildNotificationActor(actor),
          estadoAnterior: reclamo.estado as EstadoReclamo,
          estadoNuevo: EstadoReclamo.CANCELADO,
        },
      });

      return tx.reclamo.findUnique({
        where: { id: updated.id },
        include: reclamoDetailInclude,
      });
    });
  }

  async addMaterial(reclamoId: string, dto: AddMaterialDto, updatedById: string) {
    const reclamo = await this.findOne(reclamoId);

    if (
      reclamo.estado === EstadoReclamo.RESUELTO ||
      reclamo.estado === EstadoReclamo.CANCELADO
    ) {
      throw new BadRequestException(
        `No se pueden agregar materiales a un reclamo ${reclamo.estado}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const material = await tx.materialUsado.create({
        data: {
          reclamoId,
          descripcion: dto.descripcion,
          cantidad: dto.cantidad,
        },
      });

      await tx.reclamo.update({
        where: { id: reclamoId },
        data: { updatedById },
      });

      await this.writeEvento(tx, {
        reclamoId,
        tipo: ReclamoEventoTipo.MATERIAL_AGREGADO,
        actorId: updatedById,
        payload: {
          estadoAnterior: reclamo.estado as EstadoReclamo,
          estadoNuevo: reclamo.estado as EstadoReclamo,
          materiales: [
            {
              descripcion: dto.descripcion,
              cantidad: dto.cantidad,
            },
          ],
        },
      });

      return material;
    });
  }

  async createChatMessage(
    reclamoId: string,
    dto: CreateReclamoMensajeDto,
    userRol: Rol,
    userId: string,
  ) {
    const reclamo = await this.ensureChatAccess(reclamoId, userRol, userId);

    const contenido = dto.contenido.trim();
    if (!contenido) {
      throw new BadRequestException('El mensaje no puede estar vacio');
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const message = await tx.reclamoMensaje.create({
        data: {
          reclamoId,
          autorId: userId,
          contenido,
          lecturas: {
            create: {
              usuarioId: userId,
            },
          },
        },
        include: {
          ...reclamoChatInclude,
          lecturas: {
            where: { usuarioId: userId },
            select: { readAt: true },
          },
        },
      });

      await tx.reclamo.update({
        where: { id: reclamoId },
        data: { updatedById: userId },
      });

      const recipientIds =
        userRol === Rol.TECNICO
          ? this.getOperativeRecipientIds(reclamo)
          : reclamo.tecnicoId
            ? [reclamo.tecnicoId]
            : [];

      await this.notificationsService.createForUsers(tx, {
        actorId: userId,
        recipientIds,
        type: NotificationType.MENSAJE_INTERNO,
        title: `Mensaje interno en ${reclamo.numeroReclamo}`,
        message: `${message.autor.nombre}: ${contenido}`,
        eventId: message.id,
        reclamo: {
          id: reclamo.id,
          numeroReclamo: reclamo.numeroReclamo,
          estado: reclamo.estado as EstadoReclamo,
        },
        metadata: {
          actor: this.buildNotificationActor(message.autor),
        },
      });

      return message;
    });

    return this.toChatMessage(created, userId);
  }

  async markChatRead(reclamoId: string, userRol: Rol, userId: string) {
    await this.ensureChatAccess(reclamoId, userRol, userId);

    const unreadMessages = await this.prisma.reclamoMensaje.findMany({
      where: {
        reclamoId,
        autorId: { not: userId },
        lecturas: {
          none: { usuarioId: userId },
        },
      },
      select: { id: true },
    });

    if (unreadMessages.length === 0) {
      return {
        reclamoId,
        markedCount: 0,
        readAt: new Date(),
      };
    }

    const readAt = new Date();

    await this.prisma.reclamoMensajeLectura.createMany({
      data: unreadMessages.map((message) => ({
        mensajeId: message.id,
        usuarioId: userId,
        readAt,
      })),
      skipDuplicates: true,
    });

    return {
      reclamoId,
      markedCount: unreadMessages.length,
      readAt,
    };
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

  async exportReclamos(filters: ExportReclamosDto): Promise<Buffer> {
    const where: Record<string, unknown> = {
      fechaRecepcion: {
        gte: new Date(filters.desde),
        lte: new Date(filters.hasta),
      },
    };

    if (filters.estado) where['estado'] = filters.estado;
    if (filters.servicioAfectado) where['servicioAfectado'] = filters.servicioAfectado;

    const data = await this.prisma.reclamo.findMany({
      where,
      orderBy: { fechaRecepcion: 'asc' },
      include: {
        tecnico: { select: { id: true, nombre: true } },
        asignadoPor: { select: { id: true, nombre: true } },
        materiales: true,
      },
    });

    const headers = [
      'N°', 'Cliente', 'Telefono', 'Direccion', 'Servicio', 'Prioridad',
      'Categoria', 'Subcategoria', 'Estado', 'Fecha Recepcion', 'Hora Recepcion',
      'Tecnico Asignado', 'Asignado Por', 'Fecha Asignacion', 'Fecha Atencion',
      'Hora Atencion', 'Falla Encontrada', 'Materiales',
    ];

    const rows = data.map((r) => ({
      'N°': r.numeroReclamo,
      'Cliente': r.nombre,
      'Telefono': r.telefono,
      'Direccion': r.direccion,
      'Servicio': r.servicioAfectado,
      'Prioridad': r.prioridad,
      'Categoria': r.categoria ?? '—',
      'Subcategoria': r.subcategoria ?? '—',
      'Estado': r.estado,
      'Fecha Recepcion': new Date(r.fechaRecepcion).toLocaleDateString('es-AR'),
      'Hora Recepcion': r.horaRecepcion,
      'Tecnico Asignado': r.tecnico?.nombre ?? '—',
      'Asignado Por': r.asignadoPor?.nombre ?? '—',
      'Fecha Asignacion': r.fechaAsignacion ? new Date(r.fechaAsignacion).toLocaleDateString('es-AR') : '—',
      'Fecha Atencion': r.fechaAtencion ? new Date(r.fechaAtencion).toLocaleDateString('es-AR') : '—',
      'Hora Atencion': r.horaAtencion ?? '—',
      'Falla Encontrada': r.fallaEncontrada ?? '—',
      'Materiales': r.materiales?.map((m) => `${m.cantidad}x ${m.descripcion}`).join(', ') ?? '—',
    }));

    let worksheet;
    if (rows.length === 0) {
      worksheet = XLSX.utils.aoa_to_sheet([headers]);
    } else {
      worksheet = XLSX.utils.json_to_sheet(rows);
    }
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reclamos');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }
}
