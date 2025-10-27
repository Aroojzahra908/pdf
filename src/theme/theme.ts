import { MD3DarkTheme } from 'react-native-paper';

const colors = {
  primary: '#ff6b6b', // red/coral
  onPrimary: '#ffffff',
  background: '#1a1a2e', // dark navy
  surface: '#16213e', // darker navy
  text: '#ffffff',
  secondary: '#0f3460', // dark blue
  surfaceVariant: '#2d2d44',
  onSurfaceVariant: '#e0e0e0',
};

export const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.primary,
    onPrimary: colors.onPrimary,
    background: colors.background,
    surface: colors.surface,
    onSurface: colors.text,
    secondary: colors.secondary,
    surfaceVariant: colors.surfaceVariant,
    onSurfaceVariant: colors.onSurfaceVariant,
  },
};

export type AppTheme = typeof theme;
