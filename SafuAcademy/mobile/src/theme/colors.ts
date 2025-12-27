export const Colors = {
  light: {
    primary: '#111111', // Black primary for SafuDomains style
    primaryDark: '#000000',
    primaryLight: '#333333',
    background: '#F8F8F7', // Off-white/beige background from SafuDomains
    backgroundSecondary: '#FFFFFF',
    card: 'rgba(255, 255, 255, 0.92)', // Glass-like card
    text: '#111111',
    textSecondary: '#666666',
    border: 'rgba(0, 0, 0, 0.06)',
    error: '#EF4444',
    success: '#14D46B',
    warning: '#F59E0B',
    info: '#3B82F6',
    shadow: 'rgba(0, 0, 0, 0.08)',
    accent: '#F4F4F4',
  },
  dark: {
    primary: '#FFFB00', // Yellow accent for SafuAcademy dark style
    primaryDark: '#E6E200',
    primaryLight: '#FFFF33',
    background: '#040409', // Deeper dark for Academy
    backgroundSecondary: '#0A0A0F',
    card: '#12121A', // Elevated dark card
    text: '#FFFFFF',
    textSecondary: '#A0A0B0',
    border: 'rgba(255, 255, 255, 0.12)',
    error: '#FF5252',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#3B82F6',
    shadow: 'rgba(0, 0, 0, 0.4)',
    accent: '#1E1E2E',
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
