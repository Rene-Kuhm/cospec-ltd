import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Usuario } from '@prisma/client';
import { NotificationsService } from './notifications.service';
import { GetNotificationsQueryDto } from './dto/get-notifications-query.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  getNotifications(@CurrentUser() user: Usuario, @Query() query: GetNotificationsQueryDto) {
    return this.notificationsService.listForUser(user.id, query.limit);
  }

  @Get('unread-count')
  getUnreadCount(@CurrentUser() user: Usuario) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Post('read-all')
  markAllRead(@CurrentUser() user: Usuario) {
    return this.notificationsService.markAllRead(user.id);
  }

  @Post(':id/read')
  markRead(@Param('id') id: string, @CurrentUser() user: Usuario) {
    return this.notificationsService.markRead(id, user.id);
  }
}
