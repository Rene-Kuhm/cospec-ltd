import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { theme } from '../../src/theme';
import { useNotifications } from '../../src/hooks/useNotifications';

function formatNotificationDate(value: string | Date) {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function NotificationsScreen() {
  const { notifications, unreadCount, isLoading, refresh, markAsRead, markAllAsRead } = useNotifications();

  async function handleOpenNotification(id: string, entityId?: string | null) {
    await markAsRead(id);
    if (entityId) {
      router.push(`/reclamo/${entityId}`);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={theme.colors.accent} />}
      >
        <View style={styles.hero}>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>CENTRO OPERATIVO</Text>
            <Text style={styles.title}>Notificaciones</Text>
            <Text style={styles.subtitle}>Asignaciones, mensajes y cierres. Solo lo que mueve el laburo, sin push falopa.</Text>
          </View>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeLabel}>Sin leer</Text>
            <Text style={styles.heroBadgeValue}>{unreadCount}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.markAllButton, unreadCount === 0 && styles.markAllButtonDisabled]}
          disabled={unreadCount === 0}
          onPress={() => void markAllAsRead()}
        >
          <Text style={styles.markAllButtonText}>Marcar todas como leidas</Text>
        </TouchableOpacity>

        {notifications.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Sin novedades</Text>
            <Text style={styles.emptyText}>Cuando algo importante cambie en tus reclamos, aparece aca.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {notifications.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.card, !item.readAt && styles.cardUnread]}
                onPress={() => void handleOpenNotification(item.id, item.entityId)}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  {!item.readAt && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.cardBody}>{item.message}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>{item.claim?.numeroReclamo ?? 'OPERACION'}</Text>
                  <Text style={styles.metaText}>{formatNotificationDate(item.createdAt)}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 16, paddingBottom: 28, gap: 12 },
  hero: {
    backgroundColor: theme.colors.panel,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
  },
  heroCopy: { flex: 1 },
  eyebrow: { color: theme.colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1.6 },
  title: { marginTop: 8, color: theme.colors.text, fontSize: 24, fontWeight: '700' },
  subtitle: { marginTop: 8, color: theme.colors.textMuted, fontSize: 14, lineHeight: 21 },
  heroBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: theme.radius.md, paddingHorizontal: 16, paddingVertical: 12 },
  heroBadgeLabel: { color: theme.colors.textSoft, fontSize: 12 },
  heroBadgeValue: { marginTop: 4, color: theme.colors.text, fontSize: 24, fontWeight: '700' },
  markAllButton: { backgroundColor: theme.colors.panelStrong, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: 14, alignItems: 'center' },
  markAllButtonDisabled: { opacity: 0.45 },
  markAllButtonText: { color: theme.colors.accent, fontSize: 13, fontWeight: '700', letterSpacing: 0.6 },
  list: { gap: 12 },
  card: { backgroundColor: theme.colors.panelStrong, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: 16 },
  cardUnread: { borderColor: 'rgba(45, 212, 191, 0.26)', backgroundColor: 'rgba(45, 212, 191, 0.08)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  cardTitle: { flex: 1, color: theme.colors.text, fontSize: 15, fontWeight: '700' },
  unreadDot: { width: 10, height: 10, borderRadius: 999, backgroundColor: theme.colors.accent, marginTop: 4 },
  cardBody: { marginTop: 8, color: theme.colors.textMuted, fontSize: 14, lineHeight: 21 },
  metaRow: { marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  metaText: { color: theme.colors.textSoft, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  emptyCard: { backgroundColor: theme.colors.panelStrong, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, padding: 22, alignItems: 'center' },
  emptyTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '700' },
  emptyText: { marginTop: 8, color: theme.colors.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 21 },
});
