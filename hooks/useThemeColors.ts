import { useColorScheme } from 'react-native';

export const GOLD = '#C09A3A';

const dark = {
  bg: '#0f172a',
  card: '#0c1520',
  cardInner: '#06111d',
  inputBg: '#0a1628',
  border: '#334155',
  borderSub: '#1e293b',
  text: '#ffffff',
  textSub: '#94a3b8',
  textMuted: '#64748b',
  textFaint: '#475569',
  placeholder: '#334155',
  iconMuted: '#475569',
  editBg: '#1e3a5f',
  deleteBg: '#3b0d0d',
  confirmBg: '#0f1c2e',
  switchTrackFalse: '#1e293b',
  savingBg: '#1e293b',
  dangerZoneBg: '#0d0808',
} as const;

const light = {
  bg: '#f8fafc',
  card: '#ffffff',
  cardInner: '#f1f5f9',
  inputBg: '#f8fafc',
  border: '#e2e8f0',
  borderSub: '#f1f5f9',
  text: '#0f172a',
  textSub: '#64748b',
  textMuted: '#94a3b8',
  textFaint: '#cbd5e1',
  placeholder: '#94a3b8',
  iconMuted: '#94a3b8',
  editBg: '#dbeafe',
  deleteBg: '#fee2e2',
  confirmBg: '#ffffff',
  switchTrackFalse: '#e2e8f0',
  savingBg: '#e2e8f0',
  dangerZoneBg: '#fff8f8',
} as const;

export type ThemeColors = typeof dark;

export function useThemeColors(): ThemeColors {
  const scheme = useColorScheme();
  return scheme === 'dark' ? dark : light;
}
