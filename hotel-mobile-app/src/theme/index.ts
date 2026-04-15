export const Colors = {
  primary: '#0066CC',
  secondary: '#00BCD4',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  
  // Room statuses
  available: '#4CAF50',
  occupied: '#2196F3',
  dirty: '#FF9800',
  maintenance: '#F44336',
  blocked: '#9E9E9E',
  
  // Grays
  text: '#333',
  textSecondary: '#666',
  textLight: '#999',
  border: '#ddd',
  background: '#f5f5f5',
  white: '#fff',
  black: '#000',
};

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold' as const,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold' as const,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 16,
  },
  small: {
    fontSize: 14,
  },
  tiny: {
    fontSize: 12,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 999,
};
