import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { EstadoBadge } from './EstadoBadge';
import { useConnectivity } from '../hooks/useConnectivity';
import { reclamosService } from '../services/reclamos.service';
import type { ReclamoRow } from '../db/reclamos.db';
const SERVICIO_LABELS: Record<string, string> = { FIBRA_OPTICA: 'Fibra óptica', ADSL: 'ADSL', TELEFONIA: 'Telefonía', TV_SENSA: 'TV Sensa' };
export function ReclamoCard({ reclamo, currentUserId, onRefresh }: { reclamo: ReclamoRow; currentUserId: string; onRefresh: () => void }) {
  const { isOnline } = useConnectivity();
  const ismine = reclamo.tecnicoId === currentUserId;
  const isPendiente = reclamo.estado === 'PENDIENTE';
  async function handleTomar() {
    if (!isOnline) { Alert.alert('Sin conexión', 'Necesitás conexión para tomar un reclamo.', [{ text: 'OK' }]); return; }
    try { await reclamosService.tomarReclamo(reclamo.id); onRefresh(); } catch (err: any) { const isConflict = err?.response?.status === 409; Alert.alert('No disponible', isConflict ? 'Ya fue tomado por otro técnico.' : err.message); }
  }
  return (
    <TouchableOpacity style={[styles.card, reclamo.pendingSync === 1 && styles.cardPending]} onPress={() => router.push(`/reclamo/${reclamo.id}`)} activeOpacity={0.7}>
      <View style={styles.header}><Text style={styles.numero}>{reclamo.numeroReclamo}</Text><EstadoBadge estado={reclamo.estado} /></View>
      <Text style={styles.nombre}>{reclamo.nombre}</Text>
      <Text style={styles.telefono}>{reclamo.telefono}</Text>
      <Text style={styles.direccion} numberOfLines={1}>{reclamo.direccion}</Text>
      <View style={styles.footer}>
        <Text style={styles.servicio}>{SERVICIO_LABELS[reclamo.servicioAfectado] ?? reclamo.servicioAfectado}</Text>
        {reclamo.pendingSync === 1 && <Text style={styles.syncPending}>⏳</Text>}
        {isPendiente && !ismine && <TouchableOpacity style={styles.tomarBtn} onPress={handleTomar}><Text style={styles.tomarBtnText}>Tomar</Text></TouchableOpacity>}
      </View>
    </TouchableOpacity>
  );
}
const styles = StyleSheet.create({ card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginHorizontal: 16, marginVertical: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2, borderWidth: 1, borderColor: '#f1f5f9' }, cardPending: { borderColor: '#f97316', borderWidth: 1.5 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }, numero: { fontSize: 11, fontFamily: 'monospace', color: '#94a3b8' }, nombre: { fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 2 }, telefono: { fontSize: 13, color: '#64748b', marginBottom: 2 }, direccion: { fontSize: 13, color: '#64748b', marginBottom: 10 }, footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, servicio: { fontSize: 12, color: '#94a3b8', flex: 1 }, syncPending: { fontSize: 11, color: '#f97316', marginRight: 8 }, tomarBtn: { backgroundColor: '#1d4ed8', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8 }, tomarBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' } });
