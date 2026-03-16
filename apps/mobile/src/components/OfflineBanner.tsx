import { View, Text, StyleSheet } from 'react-native';
import { useConnectivity } from '../hooks/useConnectivity';
export function OfflineBanner() {
  const { isOnline } = useConnectivity();
  if (isOnline) return null;
  return <View style={styles.banner}><Text style={styles.text}>⚡ Sin conexión — modo offline</Text></View>;
}
const styles = StyleSheet.create({ banner: { backgroundColor: '#f97316', paddingVertical: 8, paddingHorizontal: 16, alignItems: 'center' }, text: { color: '#fff', fontSize: 13, fontWeight: '600' } });
