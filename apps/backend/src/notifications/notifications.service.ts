import { Injectable, NotFoundException } from '@nestjs/common';
import {
  EstadoReclamo,
  GetNotificationsResponse,
  MarkAllNotificationsReadResponse,
  MarkNotificationReadResponse,
  NotificationItem,
  NotificationMetadata,
  NotificationType,
  UnreadCountResponse,
} from '@cospec/shared-types';
import { Prisma, NotificationType as PrismaNotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type NotificationRecipientInput = {
  actorId?: string | null;
  recipientIds: string[];
  type: NotificationType;
  title: string;
  message: string;
  eventId: string;
  reclamo: {
    id: string;
    numeroReclamo: string;
    estado?: EstadoReclamo;
  };
  metadata?: NotificationMetadata | null;
};

type NotificationRecord = Prisma.NotificacionGetPayload<{
  include: {
    usuario: {
      select: {
        id: true;
        nombre: true;
        email: true;
      };
    };
  };
}>;

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  private parseMetadata(payload: Prisma.JsonValue | null): NotificationMetadata | null {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return null;
    }

    return payload as unknown as NotificationMetadata;
  }

  private toNotificationItem(record: NotificationRecord): NotificationItem {
    const metadata = this.parseMetadata(record.metadata);

    return {
      id: record.id,
      type: record.tipo as unknown as NotificationType,
      title: record.titulo,
      message: record.mensaje,
      entityType: 'RECLAMO',
      entityId: record.entidadId,
      metadata,
      claim: metadata?.reclamo ?? null,
      actor: metadata?.actor ?? null,
      readAt: record.readAt,
      createdAt: record.createdAt,
    };
  }

  async listForUser(userId: string, limit = 20): Promise<GetNotificationsResponse> {
    const records = await this.prisma.notificacion.findMany({
      where: { usuarioId: userId },
      orderBy: [{ readAt: 'asc' }, { createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
    });

    return records.map((record) => this.toNotificationItem(record));
  }

  async getUnreadCount(userId: string): Promise<UnreadCountResponse> {
    const unreadCount = await this.prisma.notificacion.count({
      where: {
        usuarioId: userId,
        readAt: null,
      },
    });

    return { unreadCount };
  }

  async markRead(notificationId: string, userId: string): Promise<MarkNotificationReadResponse> {
    const notification = await this.prisma.notificacion.findFirst({
      where: {
        id: notificationId,
        usuarioId: userId,
      },
      select: {
        id: true,
        readAt: true,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notificacion no encontrada');
    }

    if (notification.readAt) {
      return {
        id: notification.id,
        readAt: notification.readAt,
      };
    }

    const readAt = new Date();
    await this.prisma.notificacion.update({
      where: { id: notificationId },
      data: { readAt },
    });

    return {
      id: notificationId,
      readAt,
    };
  }

  async markAllRead(userId: string): Promise<MarkAllNotificationsReadResponse> {
    const readAt = new Date();
    const result = await this.prisma.notificacion.updateMany({
      where: {
        usuarioId: userId,
        readAt: null,
      },
      data: { readAt },
    });

    return {
      updatedCount: result.count,
      readAt,
    };
  }

  async createForUsers(
    tx: Prisma.TransactionClient,
    input: NotificationRecipientInput,
  ): Promise<void> {
    const uniqueRecipientIds = Array.from(
      new Set(
        input.recipientIds.filter(
          (recipientId): recipientId is string => Boolean(recipientId) && recipientId !== input.actorId,
        ),
      ),
    );

    if (uniqueRecipientIds.length === 0) {
      return;
    }

    const activeRecipients = await tx.usuario.findMany({
      where: {
        id: { in: uniqueRecipientIds },
        activo: true,
      },
      select: { id: true },
    });

    if (activeRecipients.length === 0) {
      return;
    }

    const metadata: NotificationMetadata = {
      ...(input.metadata ?? {}),
      reclamo: {
        id: input.reclamo.id,
        numeroReclamo: input.reclamo.numeroReclamo,
        estado: input.reclamo.estado,
      },
    };

    await tx.notificacion.createMany({
      data: activeRecipients.map((recipient) => ({
        usuarioId: recipient.id,
        tipo: input.type as unknown as PrismaNotificationType,
        titulo: input.title,
        mensaje: input.message,
        entidadTipo: 'RECLAMO',
        entidadId: input.reclamo.id,
        metadata: metadata as unknown as Prisma.InputJsonValue,
        dedupeKey: input.eventId,
      })),
      skipDuplicates: true,
    });
  }
}
