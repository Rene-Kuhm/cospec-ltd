import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useConnectivity } from '../hooks/useConnectivity';
import { theme } from '../theme';

export function OfflineBanner() {
  const { isOnline, isSyncing, pendingCount } = useConnectivity();

  if (isSyncing) {
    return (
      <View style={styles.syncing}>
        <ActivityIndicator size="small" color={theme.colors.textStrong} />
        <Text style={styles.syncText}>Sincronizando acciones pendientes...</Text>
      </View>
    );
  }

  if (isOnline) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>Sin conexion. Trabajas en offline{pendingCount > 0 ? ` · ${pendingCount} pendiente${pendingCount > 1 ? 's' : ''}` : ''}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { backgroundColor: theme.colors.warningSoft, paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(245, 158, 11, 0.18)' },
  text: { color: '#fcd34d', fontSize: 13, fontWeight: '700' },
  syncing: { backgroundColor: theme.colors.accent, paddingVertical: 10, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  syncText: { color: theme.colors.textStrong, fontSize: 13, fontWeight: '700' },
});
