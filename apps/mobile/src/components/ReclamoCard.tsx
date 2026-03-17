import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { EstadoBadge } from './EstadoBadge';
import { useConnectivity } from '../hooks/useConnectivity';
import { reclamosService } from '../services/reclamos.service';
import type { ReclamoRow } from '../db/reclamos.db';
import type { PrioridadReclamo } from '@cospec/shared-types';
import { formatDateShort, theme } from '../theme';
const SERVICIO_LABELS: Record<string, string> = { FIBRA_OPTICA: 'Fibra óptica', ADSL: 'ADSL', TELEFONIA: 'Telefonía', TV_SENSA: 'TV Sensa' };
const PRIORIDAD_LABELS: Record<PrioridadReclamo, string> = { BAJA: 'Baja', MEDIA: 'Media', ALTA: 'Alta', CRITICA: 'Critica' };
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
      <Text style={styles.direccion} numberOfLines={2}>{reclamo.direccion}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.metaItem}>{SERVICIO_LABELS[reclamo.servicioAfectado] ?? reclamo.servicioAfectado}</Text>
        <Text style={styles.metaDot}>•</Text>
        <Text style={styles.metaItem}>{formatDateShort(reclamo.fechaRecepcion)}</Text>
      </View>
      <View style={styles.metaStack}>
        <Text style={styles.metaItem}>Prioridad {PRIORIDAD_LABELS[reclamo.prioridad] ?? reclamo.prioridad}</Text>
        <Text style={styles.metaItem}>{reclamo.categoria ?? 'Categoria sin definir'}</Text>
      </View>
      <View style={styles.footer}>
        {reclamo.pendingSync === 1 ? <Text style={styles.syncPending}>Pendiente de sync</Text> : <Text style={styles.owner}>{ismine ? 'Asignado a vos' : isPendiente ? 'Disponible para tomar' : 'En seguimiento'}</Text>}
        {isPendiente && !ismine && <TouchableOpacity style={styles.tomarBtn} onPress={handleTomar}><Text style={styles.tomarBtnText}>Tomar</Text></TouchableOpacity>}
      </View>
    </TouchableOpacity>
  );
}
const styles = StyleSheet.create({ card: { backgroundColor: theme.colors.panelStrong, borderRadius: theme.radius.lg, padding: 18, marginHorizontal: 16, marginVertical: 6, borderWidth: 1, borderColor: theme.colors.border, ...theme.shadow }, cardPending: { borderColor: 'rgba(245, 158, 11, 0.34)', borderWidth: 1.5 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }, numero: { fontSize: 11, color: theme.colors.textSoft, letterSpacing: 1.4, fontWeight: '700' }, nombre: { fontSize: 17, fontWeight: '700', color: theme.colors.text, marginBottom: 4 }, telefono: { fontSize: 13, color: theme.colors.textMuted, marginBottom: 4 }, direccion: { fontSize: 13, color: theme.colors.textMuted, marginBottom: 12, lineHeight: 20 }, metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 }, metaStack: { gap: 4, marginBottom: 14 }, metaItem: { fontSize: 12, color: theme.colors.textSoft }, metaDot: { marginHorizontal: 8, color: theme.colors.textSoft }, footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }, owner: { fontSize: 12, color: theme.colors.textSoft, flex: 1 }, syncPending: { fontSize: 12, color: '#fcd34d', flex: 1, fontWeight: '700' }, tomarBtn: { backgroundColor: theme.colors.accent, paddingHorizontal: 18, paddingVertical: 10, borderRadius: theme.radius.md }, tomarBtnText: { color: theme.colors.textStrong, fontSize: 13, fontWeight: '700' } });
