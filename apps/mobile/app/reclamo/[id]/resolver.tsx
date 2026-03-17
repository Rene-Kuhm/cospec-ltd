import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { useAuth } from '../../../src/hooks/useAuth';
import { useConnectivity } from '../../../src/hooks/useConnectivity';
import { MaterialItem, type MaterialEntry } from '../../../src/components/MaterialItem';
import { api } from '../../../src/lib/api';
import { enqueue } from '../../../src/db/sync-queue.db';
import { updateEstadoLocal } from '../../../src/db/reclamos.db';

export default function ResolverScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
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
      <ScrollView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.label}>Falla encontrada *</Text>
          <TextInput
            style={[styles.inputMultiline, fallaError ? styles.inputError : null]}
            value={falla}
            onChangeText={(v) => { setFalla(v); if (fallaError) setFallaError(''); }}
            placeholder="Describí la falla encontrada..."
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          {fallaError ? <Text style={styles.errorText}>{fallaError}</Text> : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Materiales utilizados</Text>
          {materiales.map((m, i) => <MaterialItem key={i} item={m} index={i} onChange={updateMaterial} onRemove={removeMaterial} />)}
          <TouchableOpacity style={styles.addBtn} onPress={addMaterial}><Text style={styles.addBtnText}>+ Agregar material</Text></TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.btn, saving && styles.btnDisabled]} onPress={handleResolver} disabled={saving}>
          <Text style={styles.btnText}>{saving ? 'Guardando...' : 'Confirmar resolución'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  card: { backgroundColor: '#fff', margin: 16, padding: 16, borderRadius: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  inputMultiline: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: 15, color: '#1e293b', minHeight: 100, backgroundColor: '#f8fafc' },
  inputError: { borderColor: '#ef4444' },
  errorText: { color: '#ef4444', fontSize: 12, marginTop: 4 },
  addBtn: { paddingVertical: 12, alignItems: 'center' },
  addBtnText: { color: '#1d4ed8', fontSize: 14, fontWeight: '600' },
  btn: { backgroundColor: '#16a34a', margin: 16, padding: 16, borderRadius: 12, alignItems: 'center' },
  btnDisabled: { backgroundColor: '#86efac' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
