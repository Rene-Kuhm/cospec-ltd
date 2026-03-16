import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
export interface MaterialEntry { descripcion: string; cantidad: string; }
export function MaterialItem({ item, index, onChange, onRemove }: { item: MaterialEntry; index: number; onChange: (i: number, f: 'descripcion' | 'cantidad', v: string) => void; onRemove: (i: number) => void }) {
  return (
    <View style={styles.row}>
      <TextInput style={[styles.input, { flex: 1 }]} value={item.descripcion} onChangeText={(v) => onChange(index, 'descripcion', v)} placeholder="Material" placeholderTextColor="#94a3b8" />
      <TextInput style={[styles.input, { width: 64 }]} value={item.cantidad} onChangeText={(v) => onChange(index, 'cantidad', v)} placeholder="Cant." keyboardType="numeric" placeholderTextColor="#94a3b8" />
      <TouchableOpacity style={styles.removeBtn} onPress={() => onRemove(index)}><Text style={styles.removeBtnText}>✕</Text></TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'center' }, input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: '#1e293b', backgroundColor: '#f8fafc' }, removeBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center' }, removeBtnText: { color: '#dc2626', fontSize: 13, fontWeight: '600' } });
