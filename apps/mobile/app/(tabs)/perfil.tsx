import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../../src/hooks/useAuth';
import { useRouter } from 'expo-router';
import { useSync } from '../../src/hooks/useSync';
import Constants from 'expo-constants';

export default function PerfilScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { pendingCount } = useSync();

  async function handleLogout() {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar', style: 'destructive', onPress: async () => { await logout(); router.replace('/login'); } },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{user?.nombre?.charAt(0) ?? '?'}</Text></View>
        <Text style={styles.nombre}>{user?.nombre ?? 'Técnico'}</Text>
        <Text style={styles.email}>{user?.email ?? ''}</Text>
        <View style={styles.badge}><Text style={styles.badgeText}>{user?.rol ?? 'TECNICO'}</Text></View>
      </View>

      {pendingCount > 0 && <View style={styles.pending}><Text style={styles.pendingText}>⏳ {pendingCount} acción{pendingCount > 1 ? 'es' : ''} pendiente{pendingCount > 1 ? 's' : ''} de sync</Text></View>}

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}><Text style={styles.logoutBtnText}>Cerrar sesión</Text></TouchableOpacity>

      <Text style={styles.version}>v{Constants.expoConfig?.version ?? '1.0.0'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#f8fafc', padding: 24 }, card: { backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }, avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#1e3a8a', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }, avatarText: { fontSize: 28, color: '#fff', fontWeight: 'bold' }, nombre: { fontSize: 20, fontWeight: '600', color: '#1e293b' }, email: { fontSize: 14, color: '#64748b', marginTop: 4 }, badge: { backgroundColor: '#dbeafe', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 12 }, badgeText: { color: '#1e40af', fontSize: 12, fontWeight: '600' }, pending: { backgroundColor: '#fef9c3', padding: 12, borderRadius: 8, marginTop: 16 }, pendingText: { color: '#854d0e', fontSize: 13, textAlign: 'center' }, logoutBtn: { backgroundColor: '#dc2626', padding: 16, borderRadius: 12, marginTop: 'auto', alignItems: 'center' }, logoutBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' }, version: { textAlign: 'center', color: '#94a3b8', fontSize: 12, marginTop: 16 } });
