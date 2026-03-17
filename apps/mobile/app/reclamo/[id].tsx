import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Linking } from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/hooks/useAuth';
import { useReclamos } from '../../src/hooks/useReclamos';
import { useConnectivity } from '../../src/hooks/useConnectivity';
import { EstadoBadge } from '../../src/components/EstadoBadge';
import { ReclamoChatCard } from '../../src/components/ReclamoChatCard';
import { api } from '../../src/lib/api';
import { enqueue } from '../../src/db/sync-queue.db';
import { updateEstadoLocal } from '../../src/db/reclamos.db';
import type { ReclamoRow } from '../../src/db/reclamos.db';
import type {
  GetReclamoChatResponse,
  PrioridadReclamo,
  ReclamoTimelineItem,
} from '@cospec/shared-types';
import { formatDateShort, theme } from '../../src/theme';
import { reclamosService } from '../../src/services/reclamos.service';

const SERVICIO_LABELS: Record<string, string> = { FIBRA_OPTICA: 'Fibra óptica', ADSL: 'ADSL', TELEFONIA: 'Telefonía', TV_SENSA: 'TV Sensa' };
const PRIORIDAD_LABELS: Record<PrioridadReclamo, string> = { BAJA: 'Baja', MEDIA: 'Media', ALTA: 'Alta', CRITICA: 'Critica' };

function formatTimelineDate(value: string | Date) {
  const date = new Date(value);

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default function ReclamoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { refresh } = useReclamos();
  const { isOnline } = useConnectivity();
  const [reclamo, setReclamo] = useState<ReclamoRow | null>(null);
  const [timeline, setTimeline] = useState<ReclamoTimelineItem[]>([]);
  const [chat, setChat] = useState<GetReclamoChatResponse | null>(null);
  const [chatBlocked, setChatBlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setChatBlocked(false);
    setChat(null);

    Promise.all([
      api.get(`/reclamos/${id}`),
      reclamosService.getTimeline(id),
      reclamosService.getChat(id).catch((error: any) => {
        if (error?.response?.status === 403) {
          setChatBlocked(true);
          return null;
        }

        throw error;
      }),
    ])
      .then(([reclamoResponse, timelineResponse, chatResponse]: any) => {
        setReclamo(reclamoResponse.data);
        setTimeline(timelineResponse);
        setChat(chatResponse);
      })
      .catch(() => router.back())
      .finally(() => setLoading(false));
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

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={theme.colors.accent} /></View>;
  if (!reclamo) return null;

  const ismine = reclamo.tecnicoId === user?.id;

  return (
    <>
      <Stack.Screen options={{ title: reclamo.numeroReclamo }} />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.hero}>
            <View>
              <Text style={styles.numero}>{reclamo.numeroReclamo}</Text>
              <Text style={styles.nombre}>{reclamo.nombre}</Text>
              <Text style={styles.info}>{formatDateShort(reclamo.fechaRecepcion)} · {reclamo.horaRecepcion}</Text>
            </View>
            <EstadoBadge estado={reclamo.estado} />
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Contacto</Text>
            <TouchableOpacity onPress={() => Linking.openURL('tel:' + reclamo.telefono)}>
              <Text style={[styles.value, styles.phone]}>{reclamo.telefono}</Text>
            </TouchableOpacity>
            <Text style={styles.info}>{reclamo.direccion}</Text>
          </View>

          {reclamo.pendingSync === 1 && (
            <View style={styles.pendingBanner}>
              <Text style={styles.pendingText}>Cambio local pendiente de sincronizacion</Text>
            </View>
          )}

          <View style={styles.metricRow}>
            <View style={[styles.card, styles.metricCard]}><Text style={styles.label}>Servicio</Text><Text style={styles.value}>{SERVICIO_LABELS[reclamo.servicioAfectado]}</Text></View>
            <View style={[styles.card, styles.metricCard]}><Text style={styles.label}>Prioridad</Text><Text style={styles.value}>{PRIORIDAD_LABELS[reclamo.prioridad] ?? reclamo.prioridad}</Text></View>
          </View>
          <View style={styles.metricRow}>
            <View style={[styles.card, styles.metricCard]}><Text style={styles.label}>Responsable</Text><Text style={styles.value}>{ismine ? 'Vos' : reclamo.tecnicoId ? 'Otro tecnico' : 'Sin asignar'}</Text></View>
            <View style={[styles.card, styles.metricCard]}><Text style={styles.label}>Categoria</Text><Text style={styles.value}>{reclamo.categoria ?? 'Sin definir'}</Text></View>
          </View>
          <View style={styles.card}><Text style={styles.label}>Motivo</Text><Text style={styles.value}>{reclamo.motivo}</Text></View>
          <View style={styles.card}><Text style={styles.label}>Subcategoria</Text><Text style={styles.value}>{reclamo.subcategoria ?? 'Sin definir'}</Text></View>
          {reclamo.fallaEncontrada && <View style={styles.card}><Text style={styles.label}>Falla encontrada</Text><Text style={styles.value}>{reclamo.fallaEncontrada}</Text></View>}

          {chat ? (
            <ReclamoChatCard
              reclamoId={id ?? ''}
              currentUserId={user?.id ?? ''}
              initialChat={chat}
              isOnline={isOnline}
            />
          ) : chatBlocked ? (
            <View style={styles.card}>
              <Text style={styles.label}>Chat interno</Text>
              <Text style={styles.info}>
                Este chat queda disponible solo para el tecnico asignado al caso. No hay fuga, como debe ser.
              </Text>
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.label}>Timeline auditable</Text>
            <Text style={styles.info}>Quien hizo que, y cuando. Sin chamuyo.</Text>

            <View style={styles.timelineList}>
              {timeline.length === 0 ? (
                <View style={styles.timelineEmpty}>
                  <Text style={styles.timelineEmptyText}>
                    Este reclamo todavia no tiene eventos auditables registrados.
                  </Text>
                </View>
              ) : (
                timeline.map((item) => (
                  <View key={item.id} style={styles.timelineItem}>
                    <View style={styles.timelineHeader}>
                      <Text style={styles.timelineTitle}>{item.titulo}</Text>
                      <Text style={styles.timelineDate}>{formatTimelineDate(item.fecha)}</Text>
                    </View>
                    <Text style={styles.timelineActor}>{item.actor?.nombre ?? 'Sistema'}</Text>
                    <Text style={styles.timelineDescription}>{item.descripcion}</Text>

                    {item.payload.materiales && item.payload.materiales.length > 0 && (
                      <View style={styles.timelineTags}>
                        {item.payload.materiales.map((material) => (
                          <View
                            key={`${item.id}-${material.descripcion}-${material.cantidad}`}
                            style={styles.timelineTag}
                          >
                            <Text style={styles.timelineTagText}>
                              {material.cantidad}x {material.descripcion}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))
              )}
            </View>
          </View>

          {reclamo.estado === 'ASIGNADO' && ismine && <TouchableOpacity style={styles.btn} onPress={handleIniciar}><Text style={styles.btnText}>Iniciar trabajo</Text></TouchableOpacity>}
          {reclamo.estado === 'EN_PROGRESO' && ismine && <TouchableOpacity style={styles.btn} onPress={() => router.push(`/reclamo/${id}/resolver`)}><Text style={styles.btnText}>Resolver reclamo</Text></TouchableOpacity>}
          {(reclamo.estado === 'RESUELTO' || reclamo.estado === 'CANCELADO') && <Text style={styles.readOnly}>Caso en solo lectura</Text>}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 16, paddingBottom: 28, gap: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hero: { backgroundColor: theme.colors.panel, borderRadius: theme.radius.lg, padding: 20, borderWidth: 1, borderColor: theme.colors.border, flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  numero: { fontSize: 11, letterSpacing: 1.8, color: theme.colors.textSoft, fontWeight: '700' },
  card: { backgroundColor: theme.colors.panelStrong, padding: 16, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border },
  metricRow: { flexDirection: 'row', gap: 12 },
  metricCard: { flex: 1 },
  nombre: { fontSize: 24, fontWeight: '700', color: theme.colors.text, marginTop: 8 },
  info: { fontSize: 14, color: theme.colors.textMuted, marginTop: 6, lineHeight: 21 },
  phone: { color: theme.colors.accent, textDecorationLine: 'underline' },
  label: { fontSize: 11, color: theme.colors.textSoft, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1.4 },
  value: { fontSize: 15, color: theme.colors.text, lineHeight: 22 },
  btn: { backgroundColor: theme.colors.accent, padding: 16, borderRadius: theme.radius.md, alignItems: 'center', marginTop: 8 },
  btnText: { color: theme.colors.textStrong, fontSize: 16, fontWeight: '700' },
  pendingBanner: { backgroundColor: theme.colors.warningSoft, padding: 12, borderRadius: theme.radius.md, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.18)' },
  pendingText: { color: '#fcd34d', fontSize: 12, fontWeight: '700' },
  readOnly: { textAlign: 'center', color: theme.colors.textSoft, fontSize: 14, marginTop: 8 },
  timelineList: { gap: 12, marginTop: 12 },
  timelineItem: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: 14, backgroundColor: 'rgba(8, 17, 29, 0.28)' },
  timelineHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' },
  timelineTitle: { color: theme.colors.text, fontSize: 15, fontWeight: '700', flex: 1 },
  timelineDate: { color: theme.colors.textSoft, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  timelineActor: { color: theme.colors.accent, fontSize: 12, fontWeight: '700', marginTop: 8 },
  timelineDescription: { color: theme.colors.textMuted, fontSize: 14, lineHeight: 21, marginTop: 6 },
  timelineEmpty: { borderWidth: 1, borderStyle: 'dashed', borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: 14, backgroundColor: 'rgba(8, 17, 29, 0.18)' },
  timelineEmptyText: { color: theme.colors.textMuted, fontSize: 14, lineHeight: 21 },
  timelineTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  timelineTag: { backgroundColor: 'rgba(52, 211, 153, 0.14)', borderWidth: 1, borderColor: 'rgba(52, 211, 153, 0.18)', borderRadius: theme.radius.pill, paddingHorizontal: 10, paddingVertical: 6 },
  timelineTagText: { color: '#a7f3d0', fontSize: 12, fontWeight: '700' },
});
