import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../theme';
export interface MaterialEntry { descripcion: string; cantidad: string; }
export function MaterialItem({ item, index, onChange, onRemove }: { item: MaterialEntry; index: number; onChange: (i: number, f: 'descripcion' | 'cantidad', v: string) => void; onRemove: (i: number) => void }) {
  return (
    <View style={styles.row}>
      <TextInput style={[styles.input, { flex: 1 }]} value={item.descripcion} onChangeText={(v) => onChange(index, 'descripcion', v)} placeholder="Material" placeholderTextColor={theme.colors.textSoft} />
      <TextInput style={[styles.input, { width: 72 }]} value={item.cantidad} onChangeText={(v) => onChange(index, 'cantidad', v)} placeholder="Cant." keyboardType="numeric" placeholderTextColor={theme.colors.textSoft} />
      <TouchableOpacity style={styles.removeBtn} onPress={() => onRemove(index)}><Text style={styles.removeBtnText}>✕</Text></TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', gap: 8, marginBottom: 10, alignItems: 'center' }, input: { borderWidth: 1, borderColor: theme.colors.borderStrong, borderRadius: theme.radius.md, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: theme.colors.text, backgroundColor: 'rgba(8, 17, 29, 0.35)' }, removeBtn: { width: 36, height: 36, borderRadius: theme.radius.sm, backgroundColor: 'rgba(248, 113, 113, 0.14)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(248, 113, 113, 0.18)' }, removeBtnText: { color: '#fecaca', fontSize: 13, fontWeight: '700' } });
