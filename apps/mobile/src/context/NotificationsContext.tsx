import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type {
  GetNotificationsResponse,
  MarkAllNotificationsReadResponse,
  MarkNotificationReadResponse,
  NotificationItem,
  UnreadCountResponse,
} from '@cospec/shared-types';
import { api } from '../lib/api';
import { useAuthContext } from './AuthContext';

interface NotificationsContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthContext();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setIsLoading(true);
    try {
      const [itemsResponse, unreadResponse] = await Promise.all([
        api.get<GetNotificationsResponse>('/notifications'),
        api.get<UnreadCountResponse>('/notifications/unread-count'),
      ]);

      setNotifications(itemsResponse.data);
      setUnreadCount(unreadResponse.data.unreadCount);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    void refresh();
    const interval = setInterval(() => {
      void refresh();
    }, 20000);

    return () => clearInterval(interval);
  }, [isAuthenticated, refresh]);

  const markAsRead = useCallback(async (id: string) => {
    const target = notifications.find((item) => item.id === id);
    const response = await api.post<MarkNotificationReadResponse>(`/notifications/${id}/read`, {});

    setNotifications((current) =>
      current.map((item) => (item.id === id ? { ...item, readAt: response.data.readAt } : item)),
    );

    if (target && !target.readAt) {
      setUnreadCount((current) => Math.max(0, current - 1));
    }
  }, [notifications]);

  const markAllAsRead = useCallback(async () => {
    const response = await api.post<MarkAllNotificationsReadResponse>('/notifications/read-all', {});
    setNotifications((current) =>
      current.map((item) => ({
        ...item,
        readAt: item.readAt ?? response.data.readAt,
      })),
    );
    setUnreadCount(0);
  }, []);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        refresh,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotificationsContext() {
  const context = useContext(NotificationsContext);
  if (!context) throw new Error('useNotificationsContext must be used inside NotificationsProvider');
  return context;
}
