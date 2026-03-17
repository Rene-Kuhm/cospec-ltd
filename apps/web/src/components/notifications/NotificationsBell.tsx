'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import type {
  GetNotificationsResponse,
  MarkAllNotificationsReadResponse,
  MarkNotificationReadResponse,
  NotificationItem,
  UnreadCountResponse,
} from '@cospec/shared-types';

const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/api/v1';

function formatNotificationDate(value: string | Date) {
  const date = new Date(value);

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

async function requestWithToken<T>(
  accessToken: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function NotificationsBell() {
  const router = useRouter();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const unreadLabel = useMemo(() => {
    if (unreadCount === 0) return 'Sin pendientes';
    if (unreadCount === 1) return '1 pendiente';
    return `${unreadCount} pendientes`;
  }, [unreadCount]);

  async function refreshUnreadCount() {
    if (!accessToken) return;

    try {
      const data = await requestWithToken<UnreadCountResponse>(
        accessToken,
        '/notifications/unread-count',
      );
      setUnreadCount(data.unreadCount);
    } catch {
      setError('No pude cargar el contador');
    }
  }

  async function refreshNotifications() {
    if (!accessToken) return;

    setIsLoading(true);
    try {
      const [items, count] = await Promise.all([
        requestWithToken<GetNotificationsResponse>(accessToken, '/notifications?limit=18'),
        requestWithToken<UnreadCountResponse>(accessToken, '/notifications/unread-count'),
      ]);

      setNotifications(items);
      setUnreadCount(count.unreadCount);
      setError(null);
    } catch {
      setError('No pude cargar notificaciones');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refreshUnreadCount();
    const interval = window.setInterval(() => {
      void refreshUnreadCount();
      if (isOpen) {
        void refreshNotifications();
      }
    }, 20000);

    return () => window.clearInterval(interval);
  }, [accessToken, isOpen]);

  useEffect(() => {
    if (isOpen) {
      void refreshNotifications();
    }
  }, [isOpen]);

  async function handleMarkAllRead() {
    if (!accessToken) return;

    try {
      const result = await requestWithToken<MarkAllNotificationsReadResponse>(
        accessToken,
        '/notifications/read-all',
        { method: 'POST' },
      );

      setUnreadCount(0);
      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          readAt: item.readAt ?? result.readAt,
        })),
      );
    } catch {
      setError('No pude marcar todas como leidas');
    }
  }

  async function handleOpenNotification(item: NotificationItem) {
    if (!accessToken) return;

    try {
      if (!item.readAt) {
        const result = await requestWithToken<MarkNotificationReadResponse>(
          accessToken,
          `/notifications/${item.id}/read`,
          { method: 'POST' },
        );

        setNotifications((current) =>
          current.map((entry) =>
            entry.id === item.id ? { ...entry, readAt: result.readAt } : entry,
          ),
        );
        setUnreadCount((current) => Math.max(0, current - 1));
      }
    } catch {
      setError('No pude actualizar la notificacion');
    }

    setIsOpen(false);
    if (item.entityId) {
      router.push(`/dashboard/reclamos/${item.entityId}`);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="relative inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-teal-300">
          <path d="M12 4a4 4 0 0 0-4 4v2.1c0 .67-.2 1.32-.58 1.88L6 14h12l-1.42-2.02A3.24 3.24 0 0 1 16 10.1V8a4 4 0 0 0-4-4Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 18a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
        <span>Notificaciones</span>
        {unreadCount > 0 && (
          <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-teal-400 px-2 py-1 text-xs font-bold text-slate-950">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="app-shell-panel absolute right-0 top-[calc(100%+12px)] z-30 w-[min(92vw,26rem)] overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-slate-50">Centro operativo</p>
              <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-400">{unreadLabel}</p>
            </div>
            <button
              type="button"
              onClick={() => void handleMarkAllRead()}
              disabled={unreadCount === 0}
              className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Marcar todo
            </button>
          </div>

          <div className="max-h-[28rem] overflow-y-auto p-3">
            {isLoading ? (
              <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-400">
                Cargando notificaciones...
              </div>
            ) : notifications.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-400">
                Sin ruido innecesario. Cuando pase algo relevante, cae aca.
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => void handleOpenNotification(item)}
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition ${item.readAt ? 'border-white/8 bg-slate-950/20' : 'border-teal-400/30 bg-teal-400/10'}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-50">{item.title}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-300">{item.message}</p>
                      </div>
                      {!item.readAt && <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-teal-300" />}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                      {item.claim?.numeroReclamo && <span>{item.claim.numeroReclamo}</span>}
                      {item.actor?.nombre && <span>{item.actor.nombre}</span>}
                      <span>{formatNotificationDate(item.createdAt)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {error && <p className="mt-3 text-xs text-rose-300">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
