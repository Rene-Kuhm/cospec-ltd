'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import type {
  CreateReclamoMensajeResponse,
  GetReclamoChatResponse,
  MarkReclamoChatReadResponse,
} from '@cospec/shared-types';

const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/api/v1';

interface ReclamoChatPanelProps {
  reclamoId: string;
  currentUserId: string;
  initialChat: GetReclamoChatResponse;
}

function formatChatDate(value: string | Date) {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function ReclamoChatPanel({
  reclamoId,
  currentUserId,
  initialChat,
}: ReclamoChatPanelProps) {
  const { data: session } = useSession();
  const [chat, setChat] = useState(initialChat);
  const [contenido, setContenido] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMarkingRead, setIsMarkingRead] = useState(false);

  useEffect(() => {
    setChat(initialChat);
  }, [initialChat]);

  useEffect(() => {
    if (!session?.accessToken || chat.unreadCount === 0 || isMarkingRead) {
      return;
    }

    void markAsRead();
  }, [chat.unreadCount, isMarkingRead, session?.accessToken]);

  const hasMessages = chat.messages.length > 0;
  const unreadLabel = useMemo(() => {
    if (chat.unreadCount === 0) return 'Todo leido';
    if (chat.unreadCount === 1) return '1 mensaje nuevo';
    return `${chat.unreadCount} mensajes nuevos`;
  }, [chat.unreadCount]);

  async function markAsRead() {
    if (!session?.accessToken) return;

    setIsMarkingRead(true);

    try {
      const res = await fetch(`${API_BASE}/reclamos/${reclamoId}/chat/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({}),
      });

      if (!res.ok) return;

      const data = (await res.json()) as MarkReclamoChatReadResponse;
      if (data.markedCount === 0) {
        setChat((prev) => ({ ...prev, unreadCount: 0 }));
        return;
      }

      setChat((prev) => ({
        ...prev,
        unreadCount: 0,
        messages: prev.messages.map((message) =>
          message.autorId === currentUserId || message.isRead
            ? message
            : { ...message, isRead: true, readAt: data.readAt },
        ),
      }));
    } finally {
      setIsMarkingRead(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const mensaje = contenido.trim();
    if (!mensaje || !session?.accessToken || isSubmitting || !chat.canWrite) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/reclamos/${reclamoId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ contenido: mensaje }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? 'No se pudo enviar el mensaje');
      }

      const created = (await res.json()) as CreateReclamoMensajeResponse;

      setChat((prev) => ({
        ...prev,
        messages: [...prev.messages, created],
      }));
      setContenido('');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo enviar el mensaje');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="app-shell-panel p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500">
            Chat interno
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Canal operativo entre mesa de control y tecnico del caso. Nada sale de este reclamo.
          </p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
          {unreadLabel}
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {!hasMessages ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-5 text-sm text-slate-400">
            Todavia no hay mensajes internos para este reclamo.
          </div>
        ) : (
          chat.messages.map((message) => {
            const isOwn = message.autorId === currentUserId;

            return (
              <div
                key={message.id}
                className={isOwn ? 'flex justify-end' : 'flex justify-start'}
              >
                <div
                  className={
                    isOwn
                      ? 'max-w-[85%] rounded-[28px] rounded-br-lg border border-cyan-400/20 bg-cyan-400/10 px-4 py-4 text-right'
                      : 'max-w-[85%] rounded-[28px] rounded-bl-lg border border-white/10 bg-white/[0.04] px-4 py-4'
                  }
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                    <span className={isOwn ? 'text-cyan-200' : 'text-slate-400'}>{message.autor.nombre}</span>
                    <span>{message.autor.rol}</span>
                    {!message.isRead && !isOwn ? (
                      <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-1 text-[10px] font-semibold text-amber-200">
                        Nuevo
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-100">
                    {message.contenido}
                  </p>
                  <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    {formatChatDate(message.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-3">
        <textarea
          value={contenido}
          onChange={(event) => setContenido(event.target.value)}
          rows={4}
          placeholder="Escribi una aclaracion operativa para el tecnico..."
          disabled={!chat.canWrite || isSubmitting}
          className="app-shell-input min-h-[120px] resize-y"
        />

        {error ? (
          <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
            Solo visible para perfiles internos autorizados.
          </p>
          <button
            type="submit"
            disabled={!chat.canWrite || isSubmitting || !contenido.trim()}
            className="app-shell-button w-full sm:w-auto"
          >
            {isSubmitting ? 'Enviando...' : 'Enviar mensaje'}
          </button>
        </div>
      </form>
    </div>
  );
}
