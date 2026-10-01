// Ashwa India brand theme: navy + gold equestrian look, matching the web
// marketplace and admin panel branding.
export const colors = {
  background: '#FAF7F1',
  foreground: '#0F2238',
  card: '#ffffff',

  primary: '#C28D2E',
  primaryForeground: '#ffffff',
  secondary: '#F3E8D2',
  secondaryForeground: '#8A6416',

  muted: '#F1EEE6',
  mutedForeground: '#64748B',
  accent: '#F6E9C9',
  accentForeground: '#8A6416',
  destructive: '#ef4444',

  border: '#E4E1D8',

  // Navy — the brand's dark surface (headers, footers, hero sections).
  navy: '#0B1C33',
  navyLight: '#132B4A',
  navyForeground: '#ffffff',
  navyMuted: '#A9B8CC',

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
