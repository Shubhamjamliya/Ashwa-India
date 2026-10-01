// Mirrors the web panel's design tokens (frontend/src/index.css) so the
// mobile app and web panels feel like the same product.
export const colors = {
  background: '#faf8f5',
  foreground: '#211a12',
  card: '#ffffff',

  primary: '#92400e',
  primaryForeground: '#ffffff',
  secondary: '#fdf1de',
  secondaryForeground: '#7c2d12',

  muted: '#f2ede4',
  mutedForeground: '#6b5d4d',
  accent: '#fef3c7',
  accentForeground: '#78350f',
  destructive: '#ef4444',

  border: '#e7dfd1',

  success: '#16a34a',
  warning: '#f59e0b',
  info: '#0ea5e9',

  white: '#ffffff',
  black: '#000000',
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;
