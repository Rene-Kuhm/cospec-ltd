import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/hooks/useAuth';
import { useRouter } from 'expo-router';
import { useSync } from '../../src/hooks/useSync';
import Constants from 'expo-constants';
import { theme } from '../../src/theme';

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
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{user?.nombre?.charAt(0) ?? '?'}</Text></View>
          <Text style={styles.nombre}>{user?.nombre ?? 'Tecnico'}</Text>
          <Text style={styles.email}>{user?.email ?? ''}</Text>
          <View style={styles.badge}><Text style={styles.badgeText}>{user?.rol ?? 'TECNICO'}</Text></View>
        </View>

        <View style={styles.infoPanel}>
          <Text style={styles.panelTitle}>Estado operativo</Text>
          <Text style={styles.panelText}>El perfil concentra identidad, version y cola pendiente para que no labures a ciegas.</Text>
        </View>

        {pendingCount > 0 && <View style={styles.pending}><Text style={styles.pendingText}>{pendingCount} accion{pendingCount > 1 ? 'es' : ''} pendiente{pendingCount > 1 ? 's' : ''} de sincronizacion</Text></View>}

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}><Text style={styles.logoutBtnText}>Cerrar sesion</Text></TouchableOpacity>

        <Text style={styles.version}>v{Constants.expoConfig?.version ?? '1.0.0'}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 24, gap: 16, flexGrow: 1 },
  card: { backgroundColor: theme.colors.panel, borderRadius: theme.radius.lg, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border, ...theme.shadow },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.colors.accentAlt, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatarText: { fontSize: 30, color: theme.colors.text, fontWeight: '700' },
  nombre: { fontSize: 22, fontWeight: '700', color: theme.colors.text },
  email: { fontSize: 14, color: theme.colors.textMuted, marginTop: 6 },
  badge: { backgroundColor: 'rgba(45, 212, 191, 0.12)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: theme.radius.pill, marginTop: 14, borderWidth: 1, borderColor: 'rgba(45, 212, 191, 0.18)' },
  badgeText: { color: theme.colors.accent, fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  infoPanel: { backgroundColor: theme.colors.panelStrong, borderRadius: theme.radius.md, padding: 18, borderWidth: 1, borderColor: theme.colors.border },
  panelTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '700' },
  panelText: { marginTop: 8, color: theme.colors.textMuted, lineHeight: 22 },
  pending: { backgroundColor: theme.colors.warningSoft, padding: 14, borderRadius: theme.radius.md, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.18)' },
  pendingText: { color: '#fcd34d', fontSize: 13, textAlign: 'center', fontWeight: '600' },
  logoutBtn: { backgroundColor: theme.colors.danger, padding: 16, borderRadius: theme.radius.md, marginTop: 'auto', alignItems: 'center' },
  logoutBtnText: { color: theme.colors.textStrong, fontSize: 16, fontWeight: '700' },
  version: { textAlign: 'center', color: theme.colors.textSoft, fontSize: 12, marginTop: 8 },
});
