import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

interface ColorConfig { bg: string; text: string; label: string }

const COLORS: Record<string, ColorConfig> = {
  PENDIENTE: { bg: '#3a2a08', text: '#fcd34d', label: 'Pendiente' },
  ASIGNADO: { bg: '#132841', text: '#93c5fd', label: 'Asignado' },
  EN_PROGRESO: { bg: '#3b200d', text: '#fdba74', label: 'En progreso' },
  RESUELTO: { bg: '#0f332b', text: '#6ee7b7', label: 'Resuelto' },
  CANCELADO: { bg: '#1f2937', text: '#cbd5e1', label: 'Cancelado' },
};

const FALLBACK: ColorConfig = COLORS['PENDIENTE'] as ColorConfig;

export function EstadoBadge({ estado }: { estado: string }) {
  const colorConfig: ColorConfig = COLORS[estado] ?? FALLBACK;
  return (
    <View style={[styles.badge, { backgroundColor: colorConfig.bg }]}>
      <Text style={[styles.text, { color: colorConfig.text }]}>{colorConfig.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: theme.radius.pill, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  text: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
});
