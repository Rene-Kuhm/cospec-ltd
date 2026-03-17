import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type {
  CreateReclamoMensajeResponse,
  GetReclamoChatResponse,
  MarkReclamoChatReadResponse,
} from '@cospec/shared-types';
import { reclamosService } from '../services/reclamos.service';
import { theme } from '../theme';

interface ReclamoChatCardProps {
  reclamoId: string;
  currentUserId: string;
  initialChat: GetReclamoChatResponse;
  isOnline: boolean;
}

function formatChatDate(value: string | Date) {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function ReclamoChatCard({
  reclamoId,
  currentUserId,
  initialChat,
  isOnline,
}: ReclamoChatCardProps) {
  const [chat, setChat] = useState(initialChat);
  const [contenido, setContenido] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);

  useEffect(() => {
    setChat(initialChat);
  }, [initialChat]);

  useEffect(() => {
    if (!isOnline || chat.unreadCount === 0 || markingRead) {
      return;
    }

    void markAsRead();
  }, [chat.unreadCount, isOnline, markingRead]);

  const unreadLabel = useMemo(() => {
    if (chat.unreadCount === 0) return 'Todo leido';
    if (chat.unreadCount === 1) return '1 mensaje nuevo';
    return `${chat.unreadCount} mensajes nuevos`;
  }, [chat.unreadCount]);

  async function markAsRead() {
    setMarkingRead(true);

    try {
      const data: MarkReclamoChatReadResponse = await reclamosService.markChatRead(reclamoId);
      setChat((prev) => ({
        ...prev,
        unreadCount: 0,
        messages: prev.messages.map((message) =>
          message.autorId === currentUserId || message.isRead
            ? message
            : { ...message, isRead: true, readAt: data.readAt },
        ),
      }));
    } catch {
      // No bloqueamos la pantalla por un badge de lectura.
    } finally {
      setMarkingRead(false);
    }
  }

  async function handleSend() {
    const mensaje = contenido.trim();
    if (!mensaje || sending || !chat.canWrite || !isOnline) return;

    setSending(true);
    setError(null);

    try {
      const created: CreateReclamoMensajeResponse = await reclamosService.sendChatMessage(reclamoId, {
        contenido: mensaje,
      });

      setChat((prev) => ({
        ...prev,
        messages: [...prev.messages, created],
      }));
      setContenido('');
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'No se pudo enviar el mensaje');
    } finally {
      setSending(false);
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.label}>Chat interno</Text>
          <Text style={styles.info}>
            Coordinacion puntual con la mesa. Sin offline, sin inventos raros.
          </Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadLabel}</Text>
        </View>
      </View>

      <View style={styles.messages}>
        {chat.messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Todavia no hay mensajes internos para este reclamo.</Text>
          </View>
        ) : (
          chat.messages.map((message) => {
            const isOwn = message.autorId === currentUserId;

            return (
              <View
                key={message.id}
                style={[styles.messageRow, isOwn ? styles.messageRowOwn : styles.messageRowOther]}
              >
                <View style={[styles.messageBubble, isOwn ? styles.messageOwn : styles.messageOther]}>
                  <View style={styles.messageMeta}>
                    <Text style={[styles.messageAuthor, isOwn ? styles.messageAuthorOwn : null]}>
                      {message.autor.nombre}
                    </Text>
                    <Text style={styles.messageRole}>{message.autor.rol}</Text>
                    {!message.isRead && !isOwn ? (
                      <View style={styles.messageUnreadBadge}>
                        <Text style={styles.messageUnreadBadgeText}>Nuevo</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.messageBody}>{message.contenido}</Text>
                  <Text style={styles.messageDate}>{formatChatDate(message.createdAt)}</Text>
                </View>
              </View>
            );
          })
        )}
      </View>

      {!isOnline ? (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            El chat interno necesita conexion. No lo metimos offline porque seria un quilombo de consistencia.
          </Text>
        </View>
      ) : null}

      <TextInput
        style={styles.input}
        value={contenido}
        onChangeText={setContenido}
        placeholder="Escribi una nota para la mesa operativa..."
        placeholderTextColor={theme.colors.textSoft}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        editable={chat.canWrite && !sending && isOnline}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.button, (!contenido.trim() || sending || !isOnline) && styles.buttonDisabled]}
        onPress={handleSend}
        disabled={!contenido.trim() || sending || !chat.canWrite || !isOnline}
      >
        {sending ? (
          <ActivityIndicator color={theme.colors.textStrong} />
        ) : (
          <Text style={styles.buttonText}>Enviar mensaje</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.panelStrong,
    padding: 16,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 12,
  },
  header: {
    gap: 10,
  },
  headerText: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    color: theme.colors.textSoft,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    fontWeight: '700',
  },
  info: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  badgeText: {
    color: theme.colors.text,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  messages: {
    gap: 10,
  },
  emptyState: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: 14,
    backgroundColor: 'rgba(8, 17, 29, 0.18)',
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  messageRow: {
    flexDirection: 'row',
  },
  messageRowOwn: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '88%',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    gap: 8,
  },
  messageOwn: {
    backgroundColor: 'rgba(45, 212, 191, 0.12)',
    borderColor: 'rgba(45, 212, 191, 0.22)',
  },
  messageOther: {
    backgroundColor: 'rgba(8, 17, 29, 0.28)',
    borderColor: theme.colors.border,
  },
  messageMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  messageAuthor: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  messageAuthorOwn: {
    color: '#99f6e4',
  },
  messageRole: {
    color: theme.colors.textSoft,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  messageUnreadBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  messageUnreadBadgeText: {
    color: '#fcd34d',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  messageBody: {
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 21,
  },
  messageDate: {
    color: theme.colors.textSoft,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  warningBox: {
    backgroundColor: theme.colors.warningSoft,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    padding: 12,
  },
  warningText: {
    color: '#fcd34d',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius.md,
    padding: 14,
    minHeight: 110,
    color: theme.colors.text,
    backgroundColor: 'rgba(8, 17, 29, 0.35)',
    fontSize: 15,
  },
  errorText: {
    color: '#fecaca',
    fontSize: 12,
  },
  button: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.md,
    paddingVertical: 15,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.58,
  },
  buttonText: {
    color: theme.colors.textStrong,
    fontSize: 15,
    fontWeight: '700',
  },
});
