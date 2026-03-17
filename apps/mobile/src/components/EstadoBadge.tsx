import { View, Text, StyleSheet } from 'react-native';
const COLORS: Record<string, { bg: string; text: string; label: string }> = {
  PENDIENTE: { bg: '#fef9c3', text: '#854d0e', label: 'Pendiente' },
  ASIGNADO: { bg: '#dbeafe', text: '#1e40af', label: 'Asignado' },
  EN_PROGRESO: { bg: '#ffedd5', text: '#9a3412', label: 'En progreso' },
  RESUELTO: { bg: '#dcfce7', text: '#166534', label: 'Resuelto' },
  CANCELADO: { bg: '#f1f5f9', text: '#64748b', label: 'Cancelado' },
};
export function EstadoBadge({ estado }: { estado: string }) {
  const colorConfig = COLORS[estado] ?? COLORS.PENDIENTE;
  return (
    <View style={[styles.badge, { backgroundColor: colorConfig.bg }]}>
      <Text style={[styles.text, { color: colorConfig.text }]}>{colorConfig.label}</Text>
    </View>
  );
}
const styles = StyleSheet.create({ badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start' }, text: { fontSize: 11, fontWeight: '600' } });
