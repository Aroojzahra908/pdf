import { MD3LightTheme } from 'react-native-paper';

const colors = {
  primary: '#0fb5b1', // teal
  onPrimary: '#ffffff',
  background: '#ffffff',
  surface: '#ffffff',
  text: '#000000',
  secondary: '#0a807d',
};

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    onPrimary: colors.onPrimary,
    background: colors.background,
    surface: colors.surface,
    onSurface: colors.text,
    secondary: colors.secondary,
  },
};

export type AppTheme = typeof theme;
