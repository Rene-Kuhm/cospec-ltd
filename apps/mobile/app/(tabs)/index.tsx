import { useEffect, useState } from 'react';
import { SectionList, Text, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/hooks/useAuth';
import { useReclamos } from '../../src/hooks/useReclamos';
import { ReclamoCard } from '../../src/components/ReclamoCard';
import { OfflineBanner } from '../../src/components/OfflineBanner';
import { initDB } from '../../src/db/database';
import { theme } from '../../src/theme';

export default function ReclamosScreen() {
  const { user } = useAuth();
  const { reclamos, isLoading, refresh } = useReclamos();
  const [ready, setReady] = useState(false);

  useEffect(() => { initDB().then(() => setReady(true)); }, []);
  useEffect(() => { if (ready) void refresh(); }, [ready, refresh]);

  const pendientes = reclamos.filter((r) => r.estado === 'PENDIENTE');
  const mios = reclamos.filter((r) => r.tecnicoId === user?.id && r.estado !== 'PENDIENTE');

  const sections = [
    ...(pendientes.length > 0 ? [{ title: 'Disponibles', data: pendientes }] : []),
    ...(mios.length > 0 ? [{ title: 'Mis reclamos', data: mios }] : []),
  ];

  if (!ready) return <View style={styles.container}><Text style={styles.loadingText}>Cargando...</Text></View>;

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <OfflineBanner />
      <View style={styles.hero}>
        <View>
          <Text style={styles.eyebrow}>MESA TECNICA</Text>
          <Text style={styles.title}>Hola, {user?.nombre?.split(' ')[0] ?? 'tecnico'}</Text>
          <Text style={styles.subtitle}>Carga priorizada, estados claros y acceso rapido al siguiente paso.</Text>
        </View>
        <View style={styles.heroStat}>
          <Text style={styles.heroStatLabel}>Activos</Text>
          <Text style={styles.heroStatValue}>{reclamos.length}</Text>
        </View>
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ReclamoCard reclamo={item} currentUserId={user?.id ?? ''} onRefresh={refresh} />}
        renderSectionHeader={({ section: { title } }) => <Text style={styles.sectionHeader}>{title}</Text>}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={theme.colors.accent} />}
        ListEmptyComponent={<View style={styles.emptyCard}><Text style={styles.emptyTitle}>Sin reclamos disponibles</Text><Text style={styles.empty}>Cuando entren casos o tengas asignados, aparecen aca.</Text></View>}
        contentContainerStyle={sections.length === 0 ? styles.emptyContainer : styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  loadingText: { color: theme.colors.textMuted },
  hero: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 14,
    padding: 20,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.panel,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  eyebrow: { color: theme.colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1.6 },
  title: { marginTop: 8, fontSize: 24, fontWeight: '700', color: theme.colors.text },
  subtitle: { marginTop: 8, fontSize: 14, lineHeight: 21, color: theme.colors.textMuted, maxWidth: '80%' },
  heroStat: { alignSelf: 'flex-start', borderRadius: theme.radius.md, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 14, paddingVertical: 12 },
  heroStatLabel: { color: theme.colors.textSoft, fontSize: 12 },
  heroStatValue: { marginTop: 4, color: theme.colors.text, fontSize: 24, fontWeight: '700' },
  sectionHeader: { fontSize: 13, fontWeight: '700', color: theme.colors.textMuted, backgroundColor: theme.colors.background, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, letterSpacing: 1 },
  listContent: { paddingBottom: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
  empty: { textAlign: 'center', color: theme.colors.textMuted, marginTop: 8, lineHeight: 22 },
  emptyCard: { marginHorizontal: 16, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.panel, padding: 24, alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', paddingBottom: 32 },
});
