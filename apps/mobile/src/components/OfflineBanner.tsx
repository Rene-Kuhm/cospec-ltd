import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useConnectivity } from '../hooks/useConnectivity';

export function OfflineBanner() {
  const { isOnline, isSyncing } = useConnectivity();

  if (isSyncing) {
    return (
      <View style={styles.syncing}>
        <ActivityIndicator size="small" color="#fff" />
        <Text style={styles.syncText}>Sincronizando...</Text>
      </View>
    );
  }

  if (isOnline) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>⚡ Sin conexión — modo offline</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { backgroundColor: '#f97316', paddingVertical: 8, paddingHorizontal: 16, alignItems: 'center' },
  text: { color: '#fff', fontSize: 13, fontWeight: '600' },
  syncing: { backgroundColor: '#0ea5e9', paddingVertical: 8, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  syncText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
