/**
 * DomoNow Shared Design Tokens - TypeScript Definitions
 */

export const DomoTokens = {
  colors: {
    primary: '#6C35DE',
    primaryHover: '#5825C6',
    primaryDark: '#4A1E9E',
    primaryLight: '#F3E8FF',
    lavenderSubtle: '#EDE9FE',
    lavenderCanvas: '#FAF5FF',

    neutralBlack: '#111827',
    neutralCarbon: '#0F172A',
    neutralSecondary: '#4B5563',
    neutralMuted: '#64748B',
    neutralBorder: '#E2E8F0',
    neutralDivider: '#E5E7EB',

    surfaceWhite: '#FFFFFF',
    surfaceCanvas: '#F8FAFC',
    surfaceAlt: '#F9FAFB',

    statusSuccess: '#10B981',
    statusWhatsapp: '#25D366',
    statusWarning: '#F59E0B',
    statusDanger: '#EF4444',
    statusAvailable: '#10B981',
    statusOccupied: '#6C35DE',
    statusOutOfService: '#94A3B8',
  },
  typography: {
    fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  radii: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    full: '9999px',
  },
  shadows: {
    card: '0 4px 20px -2px rgba(108, 53, 222, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
    hover: '0 10px 25px -3px rgba(108, 53, 222, 0.12), 0 4px 10px -2px rgba(0, 0, 0, 0.05)',
  }
} as const;

export type DomoTokensType = typeof DomoTokens;
