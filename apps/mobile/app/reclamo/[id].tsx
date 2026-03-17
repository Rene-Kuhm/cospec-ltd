import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Linking } from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { useReclamos } from '../../src/hooks/useReclamos';
import { useConnectivity } from '../../src/hooks/useConnectivity';
import { EstadoBadge } from '../../src/components/EstadoBadge';
import { api } from '../../src/lib/api';
import { enqueue } from '../../src/db/sync-queue.db';
import { updateEstadoLocal } from '../../src/db/reclamos.db';
import type { ReclamoRow } from '../../src/db/reclamos.db';

const SERVICIO_LABELS: Record<string, string> = { FIBRA_OPTICA: 'Fibra óptica', ADSL: 'ADSL', TELEFONIA: 'Telefonía', TV_SENSA: 'TV Sensa' };

export default function ReclamoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { refresh } = useReclamos();
  const { isOnline } = useConnectivity();
  const [reclamo, setReclamo] = useState<ReclamoRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/reclamos/${id}`).then((r: any) => setReclamo(r.data)).catch(() => router.back()).finally(() => setLoading(false));
  }, [id]);

  async function handleIniciar() {
    if (!id) return;
    if (!isOnline) {
      try {
        await enqueue(id, 'EN_PROGRESO', { estado: 'EN_PROGRESO' });
        await updateEstadoLocal(id, 'EN_PROGRESO');
        setReclamo((prev) => prev ? { ...prev, estado: 'EN_PROGRESO', pendingSync: 1 } : prev);
      } catch (e: any) {
        Alert.alert('Error', e.message);
      }
      return;
    }
    try {
      await api.patch(`/reclamos/${id}/estado`, { estado: 'EN_PROGRESO' });
      Alert.alert('OK', 'Trabajo iniciado', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  if (!reclamo) return null;

  const ismine = reclamo.tecnicoId === user?.id;

  return (
    <>
      <Stack.Screen options={{ title: reclamo.numeroReclamo }} />
      <ScrollView style={styles.container}>
        <View style={styles.header}><Text style={styles.numero}>{reclamo.numeroReclamo}</Text><EstadoBadge estado={reclamo.estado} /></View>
        <View style={styles.card}>
          <Text style={styles.nombre}>{reclamo.nombre}</Text>
          <TouchableOpacity onPress={() => Linking.openURL('tel:' + reclamo.telefono)}>
            <Text style={[styles.info, styles.phone]}>{reclamo.telefono}</Text>
          </TouchableOpacity>
          <Text style={styles.info}>{reclamo.direccion}</Text>
        </View>
        {reclamo.pendingSync === 1 && (
          <View style={styles.pendingBanner}>
            <Text style={styles.pendingText}>Pendiente de sincronización</Text>
          </View>
        )}
        <View style={styles.card}><Text style={styles.label}>Servicio</Text><Text style={styles.value}>{SERVICIO_LABELS[reclamo.servicioAfectado]}</Text></View>
        <View style={styles.card}><Text style={styles.label}>Motivo</Text><Text style={styles.value}>{reclamo.motivo}</Text></View>
        {reclamo.fallaEncontrada && <View style={styles.card}><Text style={styles.label}>Falla encontrada</Text><Text style={styles.value}>{reclamo.fallaEncontrada}</Text></View>}

        {reclamo.estado === 'ASIGNADO' && ismine && <TouchableOpacity style={styles.btn} onPress={handleIniciar}><Text style={styles.btnText}>Iniciar trabajo</Text></TouchableOpacity>}
        {reclamo.estado === 'EN_PROGRESO' && ismine && <TouchableOpacity style={styles.btn} onPress={() => router.push(`/reclamo/${id}/resolver`)}><Text style={styles.btnText}>Resolver reclamo</Text></TouchableOpacity>}
        {(reclamo.estado === 'RESUELTO' || reclamo.estado === 'CANCELADO') && <Text style={styles.readOnly}>Solo lectura</Text>}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  numero: { fontSize: 14, fontFamily: 'monospace', color: '#64748b' },
  card: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12, padding: 16, borderRadius: 12 },
  nombre: { fontSize: 20, fontWeight: '600', color: '#1e293b' },
  info: { fontSize: 14, color: '#64748b', marginTop: 4 },
  phone: { color: '#1d4ed8', textDecorationLine: 'underline' },
  label: { fontSize: 12, color: '#94a3b8', marginBottom: 4 },
  value: { fontSize: 15, color: '#1e293b' },
  btn: { backgroundColor: '#1d4ed8', margin: 16, padding: 16, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  pendingBanner: { backgroundColor: '#fff7ed', marginHorizontal: 16, marginBottom: 8, padding: 8, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: '#f97316' },
  pendingText: { color: '#c2410c', fontSize: 12 },
  readOnly: { textAlign: 'center', color: '#94a3b8', fontSize: 14, marginVertical: 16 },
});
