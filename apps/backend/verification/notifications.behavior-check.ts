import 'reflect-metadata';
import assert from 'node:assert/strict';
import {
  EstadoReclamo,
  NotificationType,
  ReclamoEventoTipo,
  Rol,
} from '@cospec/shared-types';
import { NotificationsService } from '../src/notifications/notifications.service';
import { ReclamosService } from '../src/reclamos/reclamos.service';

type TestUser = {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
};

type TestNotification = {
  id: string;
  usuarioId: string;
  tipo: NotificationType;
  titulo: string;
  mensaje: string;
  entidadTipo: string;
  entidadId: string | null;
  metadata: Record<string, unknown> | null;
  dedupeKey: string;
  readAt: Date | null;
  createdAt: Date;
};

type TestReclamo = {
  id: string;
  numeroReclamo: string;
  telefono: string;
  nombre: string;
  direccion: string;
  motivo: string;
  servicioAfectado: 'FIBRA_OPTICA';
  prioridad: 'MEDIA';
  categoria: string | null;
  subcategoria: string | null;
  estado: EstadoReclamo;
  fechaRecepcion: Date;
  horaRecepcion: string;
  operadorId: string;
  operador: { id: string; nombre: string; email: string };
  tecnicoId: string | null;
  tecnico: { id: string; nombre: string; email: string } | null;
  asignadoPorId: string | null;
  asignadoPor: { id: string; nombre: string; email: string } | null;
  fechaAsignacion: Date | null;
  fechaAtencion: Date | null;
  horaAtencion: string | null;
  fallaEncontrada: string | null;
  updatedById: string | null;
  updatedBy: { id: string; nombre: string; email: string } | null;
  materiales: Array<{ id: string; reclamoId: string; descripcion: string; cantidad: number }>;
  createdAt: Date;
  updatedAt: Date;
};

class MemoryPrisma {
  public notifications: TestNotification[] = [];
  public events: Array<{ id: string; reclamoId: string; tipo: ReclamoEventoTipo; actorId?: string | null }> = [];
  public messages: Array<{ id: string; reclamoId: string; autorId: string; contenido: string; createdAt: Date }> = [];
  private notificationSeq = 0;
  private eventSeq = 0;
  private messageSeq = 0;
  private materialSeq = 0;

  constructor(
    public users: TestUser[],
    public reclamos: TestReclamo[],
  ) {}

  async $transaction<T>(callback: (tx: this) => Promise<T>): Promise<T> {
    return callback(this);
  }

  usuario = {
    findFirst: async (_args: any) => null as any,
    findUnique: async (_args: any) => null as any,
    findMany: async (_args: any) => [] as any,
  };

  reclamo = {
    findUnique: async (_args: any) => null as any,
    update: async (_args: any) => null as any,
  };

  reclamoEvento = {
    create: async (_args: any) => null as any,
  };

  reclamoMensaje = {
    create: async (_args: any) => null as any,
  };

  reclamoMensajeLectura = {
    createMany: async (_args: any) => ({ count: 0 }) as any,
  };

  materialUsado = {
    createMany: async (_args: any) => ({ count: 0 }) as any,
  };

  notificacion = {
    findMany: async (_args: any) => [] as any,
    count: async (_args: any) => 0 as any,
    findFirst: async (_args: any) => null as any,
    update: async (_args: any) => null as any,
    updateMany: async (_args: any) => ({ count: 0 }) as any,
    createMany: async (_args: any) => ({ count: 0 }) as any,
  };

  init() {
    this.usuario.findFirst = async ({ where }: any) => {
      return (
        this.users.find(
          (user) =>
            user.id === where.id &&
            user.rol === where.rol &&
            user.activo === where.activo,
        ) ?? null
      );
    };

    this.usuario.findUnique = async ({ where }: any) => {
      const user = this.users.find((entry) => entry.id === where.id) ?? null;
      if (!user) return null;
      return { id: user.id, nombre: user.nombre, email: user.email };
    };

    this.usuario.findMany = async ({ where }: any) => {
      const ids = new Set(where.id?.in ?? []);
      return this.users
        .filter((user) => ids.has(user.id) && user.activo === where.activo)
        .map((user) => ({ id: user.id }));
    };

    this.reclamo.findUnique = async ({ where, select, include }: any) => {
      const reclamo = this.reclamos.find((entry) => entry.id === where.id) ?? null;
      if (!reclamo) return null;

      if (select) {
        const result: Record<string, unknown> = {};
        for (const key of Object.keys(select)) {
          result[key] = (reclamo as Record<string, unknown>)[key];
        }
        return result;
      }

      if (include) {
        return {
          ...reclamo,
          materiales: [...reclamo.materiales],
        };
      }

      return { ...reclamo };
    };

    this.reclamo.update = async ({ where, data }: any) => {
      const reclamo = this.reclamos.find((entry) => entry.id === where.id);
      if (!reclamo) throw new Error('Reclamo no encontrado');

      Object.assign(reclamo, data);
      reclamo.updatedAt = new Date();
      reclamo.operador = this.resolveUserRef(reclamo.operadorId)!;
      reclamo.tecnico = reclamo.tecnicoId ? this.resolveUserRef(reclamo.tecnicoId) : null;
      reclamo.asignadoPor = reclamo.asignadoPorId ? this.resolveUserRef(reclamo.asignadoPorId) : null;
      reclamo.updatedBy = reclamo.updatedById ? this.resolveUserRef(reclamo.updatedById) : null;
      return { ...reclamo };
    };

    this.reclamoEvento.create = async ({ data }: any) => {
      const event = {
        id: `evt-${++this.eventSeq}`,
        reclamoId: data.reclamoId,
        tipo: data.tipo as ReclamoEventoTipo,
        actorId: data.actorId,
      };
      this.events.push(event);
      return event;
    };

    this.reclamoMensaje.create = async ({ data }: any) => {
      const createdAt = new Date();
      const message = {
        id: `msg-${++this.messageSeq}`,
        reclamoId: data.reclamoId,
        autorId: data.autorId,
        contenido: data.contenido,
        createdAt,
      };
      this.messages.push(message);
      const autor = this.users.find((user) => user.id === data.autorId)!;
      return {
        ...message,
        autor: {
          id: autor.id,
          nombre: autor.nombre,
          rol: autor.rol,
        },
        lecturas: [{ readAt: createdAt }],
      };
    };

    this.reclamoMensajeLectura.createMany = async () => ({ count: 0 });

    this.materialUsado.createMany = async ({ data }: any) => {
      for (const item of data) {
        const reclamo = this.reclamos.find((entry) => entry.id === item.reclamoId);
        if (reclamo) {
          reclamo.materiales.push({
            id: `mat-${++this.materialSeq}`,
            reclamoId: item.reclamoId,
            descripcion: item.descripcion,
            cantidad: item.cantidad,
          });
        }
      }
    };

    this.notificacion.findMany = async ({ where, take }: any) => {
      return this.notifications
        .filter((item) => item.usuarioId === where.usuarioId)
        .sort((left, right) => {
          if (left.readAt === null && right.readAt !== null) return -1;
          if (left.readAt !== null && right.readAt === null) return 1;
          return right.createdAt.getTime() - left.createdAt.getTime();
        })
        .slice(0, take)
        .map((item) => ({
          ...item,
          usuario: this.resolveUserRef(item.usuarioId),
        }));
    };

    this.notificacion.count = async ({ where }: any) => {
      return this.notifications.filter(
        (item) => item.usuarioId === where.usuarioId && item.readAt === where.readAt,
      ).length;
    };

    this.notificacion.findFirst = async ({ where }: any) => {
      const notification = this.notifications.find(
        (item) => item.id === where.id && item.usuarioId === where.usuarioId,
      );
      return notification ? { id: notification.id, readAt: notification.readAt } : null;
    };

    this.notificacion.update = async ({ where, data }: any) => {
      const notification = this.notifications.find((item) => item.id === where.id);
      if (!notification) throw new Error('Notificacion no encontrada');
      notification.readAt = data.readAt;
      return notification;
    };

    this.notificacion.updateMany = async ({ where, data }: any) => {
      let count = 0;
      for (const notification of this.notifications) {
        if (notification.usuarioId === where.usuarioId && notification.readAt === where.readAt) {
          notification.readAt = data.readAt;
          count += 1;
        }
      }
      return { count };
    };

    this.notificacion.createMany = async ({ data, skipDuplicates }: any) => {
      let count = 0;
      for (const item of data) {
        const exists = this.notifications.some(
          (entry) => entry.usuarioId === item.usuarioId && entry.dedupeKey === item.dedupeKey,
        );
        if (exists && skipDuplicates) {
          continue;
        }

        this.notifications.push({
          id: `noti-${++this.notificationSeq}`,
          usuarioId: item.usuarioId,
          tipo: item.tipo,
          titulo: item.titulo,
          mensaje: item.mensaje,
          entidadTipo: item.entidadTipo,
          entidadId: item.entidadId ?? null,
          metadata: item.metadata ?? null,
          dedupeKey: item.dedupeKey,
          readAt: null,
          createdAt: new Date(),
        });
        count += 1;
      }
      return { count };
    };
  }

  private resolveUserRef(userId: string) {
    const user = this.users.find((entry) => entry.id === userId);
    return user
      ? { id: user.id, nombre: user.nombre, email: user.email }
      : null;
  }
}

function createUsers(): TestUser[] {
  return [
    { id: 'admin-1', nombre: 'Admin Uno', email: 'admin@cospec.test', rol: Rol.ADMIN, activo: true },
    { id: 'oper-1', nombre: 'Operador Uno', email: 'oper@cospec.test', rol: Rol.OPERADOR, activo: true },
    { id: 'tec-1', nombre: 'Tecnico Uno', email: 'tec1@cospec.test', rol: Rol.TECNICO, activo: true },
    { id: 'tec-2', nombre: 'Tecnico Dos', email: 'tec2@cospec.test', rol: Rol.TECNICO, activo: true },
  ];
}

function createReclamo(users: TestUser[], overrides?: Partial<TestReclamo>): TestReclamo {
  const operador = users.find((user) => user.id === 'oper-1')!;
  const admin = users.find((user) => user.id === 'admin-1')!;
  const tecnico = users.find((user) => user.id === 'tec-1')!;

  return {
    id: 'rec-1',
    numeroReclamo: 'REC-2026-001',
    telefono: '1111',
    nombre: 'Cliente Test',
    direccion: 'Siempre Viva 123',
    motivo: 'Sin servicio',
    servicioAfectado: 'FIBRA_OPTICA',
    prioridad: 'MEDIA',
    categoria: null,
    subcategoria: null,
    estado: EstadoReclamo.ASIGNADO,
    fechaRecepcion: new Date('2026-03-17T10:00:00.000Z'),
    horaRecepcion: '10:00',
    operadorId: operador.id,
    operador: { id: operador.id, nombre: operador.nombre, email: operador.email },
    tecnicoId: tecnico.id,
    tecnico: { id: tecnico.id, nombre: tecnico.nombre, email: tecnico.email },
    asignadoPorId: admin.id,
    asignadoPor: { id: admin.id, nombre: admin.nombre, email: admin.email },
    fechaAsignacion: new Date('2026-03-17T10:10:00.000Z'),
    fechaAtencion: null,
    horaAtencion: null,
    fallaEncontrada: null,
    updatedById: admin.id,
    updatedBy: { id: admin.id, nombre: admin.nombre, email: admin.email },
    materiales: [],
    createdAt: new Date('2026-03-17T10:00:00.000Z'),
    updatedAt: new Date('2026-03-17T10:10:00.000Z'),
    ...overrides,
  };
}

function createContext(overrides?: Partial<TestReclamo>) {
  const users = createUsers();
  const reclamo = createReclamo(users, overrides);
  const prisma = new MemoryPrisma(users, [reclamo]);
  prisma.init();
  const notificationsService = new NotificationsService(prisma as never);
  const reclamosService = new ReclamosService(prisma as never, notificationsService);

  return { prisma, notificationsService, reclamosService, reclamo };
}

async function testAssignmentRouting() {
  const { prisma, reclamosService } = createContext();

  await reclamosService.asignarTecnico('rec-1', { tecnicoId: 'tec-2' }, 'admin-1');

  const recipients = prisma.notifications.map((item) => `${item.usuarioId}:${item.tipo}`).sort();
  assert.deepEqual(recipients, [
    'tec-1:CAMBIO_OPERATIVO',
    'tec-2:RECLAMO_ASIGNADO',
  ]);
}

async function testChatRoleRouting() {
  const techContext = createContext();
  await techContext.reclamosService.createChatMessage(
    'rec-1',
    { contenido: 'Estoy en camino' },
    Rol.TECNICO,
    'tec-1',
  );

  const techRecipients = techContext.prisma.notifications.map((item) => item.usuarioId).sort();
  assert.deepEqual(techRecipients, ['admin-1', 'oper-1']);

  const operatorContext = createContext();
  await operatorContext.reclamosService.createChatMessage(
    'rec-1',
    { contenido: 'Urgente, priorizalo' },
    Rol.OPERADOR,
    'oper-1',
  );

  const operatorRecipients = operatorContext.prisma.notifications.map((item) => item.usuarioId);
  assert.deepEqual(operatorRecipients, ['tec-1']);
}

async function testResolutionAndCancellationRouting() {
  const resolveContext = createContext({ estado: EstadoReclamo.EN_PROGRESO });
  await resolveContext.reclamosService.resolver(
    'rec-1',
    { fallaEncontrada: 'Fibra cortada', materiales: [] },
    'tec-1',
  );

  const resolutionRecipients = resolveContext.prisma.notifications.map((item) => item.usuarioId).sort();
  assert.deepEqual(resolutionRecipients, ['admin-1', 'oper-1']);

  const cancelContext = createContext();
  await cancelContext.reclamosService.cancelar('rec-1', 'admin-1');

  const cancelRecipients = cancelContext.prisma.notifications.map((item) => item.usuarioId).sort();
  assert.deepEqual(cancelRecipients, ['oper-1', 'tec-1']);
}

async function testUnreadAndMarkingFlow() {
  const { prisma, notificationsService } = createContext();

  await notificationsService.createForUsers(prisma as never, {
    actorId: 'admin-1',
    recipientIds: ['tec-1', 'tec-1', 'admin-1', 'tec-2'],
    type: NotificationType.RECLAMO_ASIGNADO,
    title: 'Asignacion',
    message: 'Nuevo trabajo',
    eventId: 'evt-dedupe',
    reclamo: {
      id: 'rec-1',
      numeroReclamo: 'REC-2026-001',
      estado: EstadoReclamo.ASIGNADO,
    },
    metadata: null,
  });

  await notificationsService.createForUsers(prisma as never, {
    actorId: 'admin-1',
    recipientIds: ['tec-1', 'tec-2'],
    type: NotificationType.RECLAMO_ASIGNADO,
    title: 'Asignacion',
    message: 'Duplicado por evento',
    eventId: 'evt-dedupe',
    reclamo: {
      id: 'rec-1',
      numeroReclamo: 'REC-2026-001',
      estado: EstadoReclamo.ASIGNADO,
    },
    metadata: null,
  });

  assert.equal(prisma.notifications.length, 2);
  assert.equal((await notificationsService.getUnreadCount('tec-1')).unreadCount, 1);
  assert.equal((await notificationsService.getUnreadCount('tec-2')).unreadCount, 1);

  const tec1Notification = prisma.notifications.find((item) => item.usuarioId === 'tec-1');
  assert.ok(tec1Notification);

  await notificationsService.markRead(tec1Notification!.id, 'tec-1');
  assert.equal((await notificationsService.getUnreadCount('tec-1')).unreadCount, 0);
  assert.equal((await notificationsService.getUnreadCount('tec-2')).unreadCount, 1);

  const markAll = await notificationsService.markAllRead('tec-2');
  assert.equal(markAll.updatedCount, 1);
  assert.equal((await notificationsService.getUnreadCount('tec-2')).unreadCount, 0);
}

async function main() {
  const checks: Array<[string, () => Promise<void>]> = [
    ['assignment routing', testAssignmentRouting],
    ['chat routing by role', testChatRoleRouting],
    ['resolution and cancellation routing', testResolutionAndCancellationRouting],
    ['unread count and mark flow', testUnreadAndMarkingFlow],
  ];

  for (const [name, check] of checks) {
    await check();
    console.log(`PASS ${name}`);
  }

  console.log('PASS Batch 5 notification behavior checks');
}

main().catch((error) => {
  console.error('FAIL Batch 5 notification behavior checks');
  console.error(error);
  process.exitCode = 1;
});
