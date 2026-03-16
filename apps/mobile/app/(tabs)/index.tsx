import { useEffect, useState } from 'react';
import { SectionList, Text, RefreshControl, StyleSheet, View } from 'react-native';
import { useAuth } from '../../src/hooks/useAuth';
import { useReclamos } from '../../src/hooks/useReclamos';
import { ReclamoCard } from '../../src/components/ReclamoCard';
import { OfflineBanner } from '../../src/components/OfflineBanner';
import { initDB } from '../../src/db/database';

export default function ReclamosScreen() {
  const { user } = useAuth();
  const { reclamos, isLoading, refresh } = useReclamos();
  const [ready, setReady] = useState(false);

  useEffect(() => { initDB().then(() => setReady(true)); }, []);

  const pendientes = reclamos.filter((r) => r.estado === 'PENDIENTE');
  const mios = reclamos.filter((r) => r.tecnicoId === user?.id && r.estado !== 'PENDIENTE');

  const sections = [
    ...(pendientes.length > 0 ? [{ title: 'Disponibles', data: pendientes }] : []),
    ...(mios.length > 0 ? [{ title: 'Mis reclamos', data: mios }] : []),
  ];

  if (!ready) return <View style={styles.container}><Text>Cargando...</Text></View>;

  return (
    <View style={styles.container}>
      <OfflineBanner />
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ReclamoCard reclamo={item} currentUserId={user?.id ?? ''} onRefresh={refresh} />}
        renderSectionHeader={({ section: { title } }) => <Text style={styles.sectionHeader}>{title}</Text>}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} />}
        ListEmptyComponent={<Text style={styles.empty}>No hay reclamos disponibles</Text>}
        contentContainerStyle={sections.length === 0 ? styles.emptyContainer : {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#f8fafc' }, sectionHeader: { fontSize: 14, fontWeight: '600', color: '#64748b', backgroundColor: '#f8fafc', paddingHorizontal: 16, paddingVertical: 8 }, empty: { textAlign: 'center', color: '#94a3b8', marginTop: 40 }, emptyContainer: { flex: 1, justifyContent: 'center' } });
