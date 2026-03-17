import { Platform } from 'react-native';

export const theme = {
  colors: {
    background: '#09111f',
    backgroundElevated: '#0f1b31',
    panel: '#12223a',
    panelStrong: '#162842',
    card: '#f7fafc',
    cardMuted: '#edf2f7',
    text: '#e6eef8',
    textStrong: '#08111d',
    textMuted: '#8da3bf',
    textSoft: '#637998',
    border: 'rgba(148, 163, 184, 0.18)',
    borderStrong: 'rgba(148, 163, 184, 0.32)',
    accent: '#2dd4bf',
    accentStrong: '#14b8a6',
    accentAlt: '#4f8cff',
    warning: '#f59e0b',
    warningSoft: '#3a2a08',
    danger: '#f87171',
    dangerSoft: '#3a1620',
    success: '#34d399',
    successSoft: '#0f332b',
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
  radius: {
    sm: 12,
    md: 18,
    lg: 24,
    pill: 999,
  },
  shadow: Platform.select({
    ios: {
      shadowColor: '#020617',
      shadowOffset: { width: 0, height: 18 },
      shadowOpacity: 0.16,
      shadowRadius: 30,
    },
    android: {
      elevation: 8,
    },
    default: {},
  }),
};

export function formatDateShort(value?: string | null) {
  if (!value) return 'Sin fecha';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
  }).format(date);
}
