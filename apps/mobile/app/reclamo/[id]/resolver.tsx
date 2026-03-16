import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { useAuth } from '../../../../src/hooks/useAuth';
import { MaterialItem, type MaterialEntry } from '../../../../src/components/MaterialItem';
import { api } from '../../../../src/lib/api';

export default function ResolverScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [falla, setFalla] = useState('');
  const [materiales, setMateriales] = useState<MaterialEntry[]>([]);
  const [saving, setSaving] = useState(false);

  function addMaterial() { setMateriales([...materiales, { descripcion: '', cantidad: '' }]); }
  function updateMaterial(i: number, field: 'descripcion' | 'cantidad', v: string) { const m = [...materiales]; m[i][field] = v; setMateriales(m); }
  function removeMaterial(i: number) { setMateriales(materiales.filter((_, idx) => idx !== i)); }

  async function handleResolver() {
    if (!falla.trim()) { Alert.alert('Required', 'Ingresá la falla encontrada'); return; }
    setSaving(true);
    try {
      const dto: any = { fallaEncontrada: falla, horaAtencion: new Date().toTimeString().slice(0, 5) };
      if (materiales.length > 0) {
        dto.materiales = materiales.filter(m => m.descripcion.trim()).map(m => ({ descripcion: m.descripcion, cantidad: parseInt(m.cantidad) || 1 }));
      }
      await api.patch(`/reclamos/${id}/resolver`, dto);
      Alert.alert('OK', 'Reclamo resuelto', [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]);
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setSaving(false); }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Resolver reclamo' }} />
      <ScrollView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.label}>Falla encontrada *</Text>
          <TextInput style={styles.inputMultiline} value={falla} onChangeText={setFalla} placeholder="Describí la falla encontrada..." placeholderTextColor="#94a3b8" multiline numberOfLines={4} textAlignVertical="top" />
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

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#f8fafc' }, card: { backgroundColor: '#fff', margin: 16, padding: 16, borderRadius: 12 }, label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }, inputMultiline: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: 15, color: '#1e293b', minHeight: 100, backgroundColor: '#f8fafc' }, addBtn: { paddingVertical: 12, alignItems: 'center' }, addBtnText: { color: '#1d4ed8', fontSize: 14, fontWeight: '600' }, btn: { backgroundColor: '#16a34a', margin: 16, padding: 16, borderRadius: 12, alignItems: 'center' }, btnDisabled: { backgroundColor: '#86efac' }, btnText: { color: '#fff', fontSize: 16, fontWeight: '600' } });
