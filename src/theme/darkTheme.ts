/**
 * Cypher Dark Theme System
 * Revolutionary dark theme inspired by the most advanced wallet UX
 */

// Core color palette for Cypher Dark Theme
export const DARK_COLORS = {
  // Primary colors - Deep space blues and purples
  primary: '#6366F1', // Indigo primary
  primaryDark: '#4F46E5',
  primaryLight: '#818CF8',
  primaryGradient: ['#6366F1', '#8B5CF6'],

  // Secondary colors - Accent colors
  secondary: '#EC4899', // Pink accent
  secondaryDark: '#DB2777',
  secondaryLight: '#F472B6',

  // Success/Error/Warning
  success: '#10B981', // Emerald
  successDark: '#059669',
  successLight: '#34D399',
  
  error: '#EF4444', // Red
  errorDark: '#DC2626',
  errorLight: '#F87171',
  
  warning: '#F59E0B', // Amber
  warningDark: '#D97706',
  warningLight: '#FBBF24',

  // Background colors - True black theme
  background: '#000000', // Pure black
  backgroundSecondary: '#0A0A0A', // Slightly lighter black
  backgroundTertiary: '#111111', // Card backgrounds
  backgroundQuaternary: '#1A1A1A', // Modal/overlay backgrounds
  bgPrimary: '#000000', // Alias for compatibility

  // Surface colors
  surface: '#1A1A1A',
  surfaceSecondary: '#262626',
  surfaceTertiary: '#333333',
  
  // Text colors - High contrast for accessibility
  text: '#FFFFFF', // Pure white text
  textSecondary: '#E5E5E5', // Light gray
  textTertiary: '#A3A3A3', // Medium gray
  textDisabled: '#525252', // Dark gray
  textMuted: '#737373',

  // Border colors
  border: '#262626',
  borderSecondary: '#404040',
  borderLight: '#525252',
  surfaceBorder: '#333333',
  surfaceLight: '#2A2A2A',

  // Interactive elements
  interactive: '#6366F1',
  interactiveHover: '#4F46E5',
  interactivePressed: '#3730A3',
  interactiveDisabled: '#374151',

  // Glass/translucent effects
  glass: 'rgba(255, 255, 255, 0.05)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  glassHover: 'rgba(255, 255, 255, 0.08)',

  // Status colors
  online: '#10B981',
  offline: '#6B7280',
  pending: '#F59E0B',
  
  // Network specific colors
  ethereum: '#627EEA',
  bitcoin: '#F7931A',
  polygon: '#8247E5',
  bsc: '#F3BA2F',
  arbitrum: '#28A0F0',
  optimism: '#FF0420',

  // Gradient backgrounds
  gradients: {
    primary: ['#6366F1', '#8B5CF6'],
    secondary: ['#EC4899', '#F97316'],
    success: ['#10B981', '#059669'],
    danger: ['#EF4444', '#DC2626'],
    dark: ['#000000', '#1A1A1A'],
    card: ['#0A0A0A', '#1A1A1A'],
  }
};

// Typography system
export const TYPOGRAPHY = {
  // Font families
  fontFamily: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semiBold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
    mono: 'RobotoMono-Regular',
  },

  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Font weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
  }
};

// Spacing system
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

// Border radius
export const RADIUS = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
};

// Shadows for dark theme
export const SHADOWS = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  small: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  large: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 12,
  },
  neon: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 8,
  },
  glow: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6,
  },
};

// Animation durations
export const ANIMATIONS = {
  fast: 150,
  normal: 300,
  slow: 500,
};

// Cypher Dark Theme for Navigation
export const CypherDarkTheme = {
  dark: true,
  colors: {
    primary: DARK_COLORS.primary,
    background: DARK_COLORS.background,
    card: DARK_COLORS.backgroundTertiary,
    text: DARK_COLORS.text,
    border: DARK_COLORS.border,
    notification: DARK_COLORS.error,
  },
};

// Theme object for components
export const DARK_THEME = {
  colors: DARK_COLORS,
  typography: TYPOGRAPHY,
  spacing: SPACING,
  radius: RADIUS,
  shadows: SHADOWS,
  animations: ANIMATIONS,
};

// Theme hook type
export interface ThemeContextType {
  colors: typeof DARK_COLORS;
  typography: typeof TYPOGRAPHY;
  spacing: typeof SPACING;
  radius: typeof RADIUS;
  shadows: typeof SHADOWS;
  animations: typeof ANIMATIONS;
  isDark: boolean;
  toggleTheme: () => void;
}

export default DARK_THEME;
