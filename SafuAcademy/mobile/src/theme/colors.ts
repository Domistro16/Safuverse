export const Colors = {
  light: {
    primary: '#fffb00',
    primaryDark: '#e6e200',
    primaryLight: '#ffff33',
    background: '#ffffff',
    backgroundSecondary: '#f8f9fa',
    card: '#ffffff',
    text: '#1a1a1a',
    textSecondary: '#6c757d',
    border: '#e9ecef',
    error: '#dc3545',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#3B82F6',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  dark: {
    primary: '#fffb00',
    primaryDark: '#e6e200',
    primaryLight: '#ffff33',
    background: '#0a0a0f',
    backgroundSecondary: '#1a1a24',
    card: '#1e1e2e',
    text: '#ffffff',
    textSecondary: '#a0a0b0',
    border: '#2a2a3a',
    error: '#ff5252',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#3B82F6',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },
} as const;

export const CommonColors = {
  transparent: 'transparent',
  white: '#ffffff',
  black: '#000000',

  // Course level colors
  beginner: '#10B981',
  intermediate: '#F59E0B',
  advanced: '#EF4444',

  // Gradient colors
  gradientStart: '#fffb00',
  gradientEnd: '#ffaa00',
} as const;

export type ThemeMode = 'light' | 'dark';
export type ColorScheme = typeof Colors.light | typeof Colors.dark;
