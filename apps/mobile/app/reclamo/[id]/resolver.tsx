import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useConnectivity } from '../../../src/hooks/useConnectivity';
import { MaterialItem, type MaterialEntry } from '../../../src/components/MaterialItem';
import { api } from '../../../src/lib/api';
import { enqueue } from '../../../src/db/sync-queue.db';
import { updateEstadoLocal } from '../../../src/db/reclamos.db';
import { theme } from '../../../src/theme';

export default function ResolverScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isOnline } = useConnectivity();
  // horaAtencion captured at mount — never reassigned (REQ-MOB-5)
  const [horaAtencion] = useState<string>(() => new Date().toTimeString().slice(0, 5));
  const [falla, setFalla] = useState('');
  const [fallaError, setFallaError] = useState('');
  const [materiales, setMateriales] = useState<MaterialEntry[]>([]);
  const [saving, setSaving] = useState(false);

  function addMaterial() { setMateriales([...materiales, { descripcion: '', cantidad: '' }]); }

  function updateMaterial(i: number, field: 'descripcion' | 'cantidad', v: string) {
    const m = [...materiales];
    const item = m[i];
    if (item !== undefined) {
      item[field] = v;
      setMateriales(m);
    }
  }

  function removeMaterial(i: number) { setMateriales(materiales.filter((_, idx) => idx !== i)); }

  async function doSubmit() {
    if (!id) return;
    setSaving(true);
    try {
      const dto = {
        fallaEncontrada: falla,
        horaAtencion,
        materiales: materiales
          .filter(m => m.descripcion.trim())
          .map(m => ({ descripcion: m.descripcion, cantidad: parseInt(m.cantidad) || 1 })),
      };

      if (!isOnline) {
        await enqueue(id, 'RESOLVER', dto);
        await updateEstadoLocal(id, 'RESUELTO', { fallaEncontrada: falla });
        router.replace('/(tabs)');
        return;
      }

      await api.patch(`/reclamos/${id}/resolver`, dto);
      Alert.alert('OK', 'Reclamo resuelto', [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  }

  function handleResolver() {
    if (!falla.trim()) {
      setFallaError('Ingresá la falla encontrada');
      return;
    }
    setFallaError('');
    Alert.alert(
      'Confirmar',
      '¿Resolver este reclamo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: () => doSubmit() },
      ],
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Resolver reclamo' }} />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>Cierre tecnico</Text>
            <Text style={styles.heroText}>Documenta la falla real y los materiales para que el reclamo quede trazable de verdad.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Falla encontrada *</Text>
            <TextInput
              style={[styles.inputMultiline, fallaError ? styles.inputError : null]}
              value={falla}
              onChangeText={(v) => { setFalla(v); if (fallaError) setFallaError(''); }}
              placeholder="Describi la falla encontrada..."
              placeholderTextColor={theme.colors.textSoft}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            {fallaError ? <Text style={styles.errorText}>{fallaError}</Text> : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Materiales utilizados</Text>
            {materiales.map((m, i) => <MaterialItem key={i} item={m} index={i} onChange={updateMaterial} onRemove={removeMaterial} />)}
            <TouchableOpacity style={styles.addBtn} onPress={addMaterial}><Text style={styles.addBtnText}>Agregar material</Text></TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.btn, saving && styles.btnDisabled]} onPress={handleResolver} disabled={saving}>
            <Text style={styles.btnText}>{saving ? 'Guardando...' : 'Confirmar resolucion'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 16, paddingBottom: 28, gap: 12 },
  hero: { backgroundColor: theme.colors.panel, borderRadius: theme.radius.lg, padding: 20, borderWidth: 1, borderColor: theme.colors.border },
  heroTitle: { color: theme.colors.text, fontSize: 22, fontWeight: '700' },
  heroText: { color: theme.colors.textMuted, marginTop: 8, lineHeight: 22 },
  card: { backgroundColor: theme.colors.panelStrong, padding: 16, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border },
  label: { fontSize: 12, fontWeight: '700', color: theme.colors.textSoft, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1.4 },
  inputMultiline: { borderWidth: 1, borderColor: theme.colors.borderStrong, borderRadius: theme.radius.md, padding: 14, fontSize: 15, color: theme.colors.text, minHeight: 110, backgroundColor: 'rgba(8, 17, 29, 0.35)' },
  inputError: { borderColor: theme.colors.danger },
  errorText: { color: '#fecaca', fontSize: 12, marginTop: 6 },
  addBtn: { paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, marginTop: 8 },
  addBtnText: { color: theme.colors.accent, fontSize: 14, fontWeight: '700' },
  btn: { backgroundColor: theme.colors.success, padding: 16, borderRadius: theme.radius.md, alignItems: 'center', marginTop: 4 },
  btnDisabled: { opacity: 0.58 },
  btnText: { color: theme.colors.textStrong, fontSize: 16, fontWeight: '700' },
});
