/**
 * Enhanced UI Design System - Complete Mobile Design Framework
 * Revolutionary design system for Cypher Wallet's premium user experience
 * Features advanced theming, animations, and accessibility
 */

import { Dimensions, PixelRatio } from 'react-native';

// Get device dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Design System Configuration
export const DESIGN_SYSTEM = {
  // Screen dimensions
  SCREEN: {
    WIDTH: SCREEN_WIDTH,
    HEIGHT: SCREEN_HEIGHT,
    SCALE: PixelRatio.get(),
    FONT_SCALE: PixelRatio.getFontScale(),
  },

  // Responsive breakpoints
  BREAKPOINTS: {
    SMALL: 320,
    MEDIUM: 375,
    LARGE: 414,
    EXTRA_LARGE: 480,
  },

  // Grid system
  GRID: {
    MARGIN: 16,
    GUTTER: 8,
    COLUMNS: 12,
  },

  // Spacing scale (based on 8px grid)
  SPACING: {
    XS: 4,
    SM: 8,
    MD: 16,
    LG: 24,
    XL: 32,
    XXL: 48,
    XXXL: 64,
  },

  // Border radius scale
  RADIUS: {
    XS: 4,
    SM: 8,
    MD: 12,
    LG: 16,
    XL: 24,
    XXL: 32,
    ROUND: 9999,
  },

  // Shadow system
  SHADOWS: {
    NONE: {
      shadowOpacity: 0,
      elevation: 0,
    },
    XS: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    SM: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    MD: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    LG: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
    XL: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.25,
      shadowRadius: 24,
      elevation: 12,
    },
  },

  // Typography scale
  TYPOGRAPHY: {
    // Font families
    FONTS: {
      PRIMARY: 'System',
      SECONDARY: 'System',
      MONO: 'Courier New',
    },

    // Font weights
    WEIGHTS: {
      LIGHT: '300',
      REGULAR: '400',
      MEDIUM: '500',
      SEMIBOLD: '600',
      BOLD: '700',
      EXTRABOLD: '800',
    },

    // Font sizes
    SIZES: {
      XXS: 10,
      XS: 12,
      SM: 14,
      MD: 16,
      LG: 18,
      XL: 20,
      XXL: 24,
      XXXL: 32,
      XXXXL: 40,
      XXXXXL: 48,
    },

    // Line heights
    LINE_HEIGHTS: {
      XXS: 12,
      XS: 16,
      SM: 20,
      MD: 24,
      LG: 28,
      XL: 32,
      XXL: 36,
      XXXL: 40,
      XXXXL: 48,
      XXXXXL: 56,
    },

    // Text styles
    STYLES: {
      H1: {
        fontSize: 32,
        lineHeight: 40,
        fontWeight: '700',
        letterSpacing: -0.5,
      },
      H2: {
        fontSize: 24,
        lineHeight: 32,
        fontWeight: '600',
        letterSpacing: -0.25,
      },
      H3: {
        fontSize: 20,
        lineHeight: 28,
        fontWeight: '600',
        letterSpacing: 0,
      },
      H4: {
        fontSize: 18,
        lineHeight: 24,
        fontWeight: '500',
        letterSpacing: 0,
      },
      BODY_LARGE: {
        fontSize: 16,
        lineHeight: 24,
        fontWeight: '400',
        letterSpacing: 0,
      },
      BODY: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '400',
        letterSpacing: 0,
      },
      BODY_SMALL: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '400',
        letterSpacing: 0,
      },
      CAPTION: {
        fontSize: 10,
        lineHeight: 12,
        fontWeight: '400',
        letterSpacing: 0.5,
      },
      BUTTON: {
        fontSize: 16,
        lineHeight: 24,
        fontWeight: '600',
        letterSpacing: 0.25,
      },
      LABEL: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '500',
        letterSpacing: 0.5,
      },
    },
  },

  // Animation durations
  ANIMATIONS: {
    FAST: 150,
    NORMAL: 250,
    SLOW: 350,
    VERY_SLOW: 500,
  },

  // Animation easing
  EASING: {
    EASE_IN: 'ease-in',
    EASE_OUT: 'ease-out',
    EASE_IN_OUT: 'ease-in-out',
    LINEAR: 'linear',
  },

  // Z-index layers
  Z_INDEX: {
    BACKGROUND: -1,
    DEFAULT: 0,
    CONTENT: 1,
    HEADER: 10,
    OVERLAY: 100,
    MODAL: 1000,
    TOOLTIP: 1001,
    TOAST: 1002,
  },
} as const;

// Color Themes
export const LIGHT_THEME = {
  // Primary colors
  PRIMARY: {
    50: '#F0F9FF',
    100: '#E0F2FE',
    200: '#BAE6FD',
    300: '#7DD3FC',
    400: '#38BDF8',
    500: '#0EA5E9',  // Main primary
    600: '#0284C7',
    700: '#0369A1',
    800: '#075985',
    900: '#0C4A6E',
  },

  // Secondary colors (Purple for Cypher branding)
  SECONDARY: {
    50: '#FAF5FF',
    100: '#F3E8FF',
    200: '#E9D5FF',
    300: '#D8B4FE',
    400: '#C084FC',
    500: '#A855F7',  // Main secondary
    600: '#9333EA',
    700: '#7C3AED',
    800: '#6B21A8',
    900: '#581C87',
  },

  // Accent colors
  ACCENT: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',  // Main accent (Success green)
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },

  // Neutral colors
  NEUTRAL: {
    0: '#FFFFFF',
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    1000: '#000000',
  },

  // Semantic colors
  ERROR: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',  // Main error
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },

  WARNING: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',  // Main warning
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },

  SUCCESS: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',  // Main success
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },

  INFO: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',  // Main info
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },

  // Background colors
  BACKGROUND: {
    PRIMARY: '#FFFFFF',
    SECONDARY: '#FAFAFA',
    TERTIARY: '#F5F5F5',
    CARD: '#FFFFFF',
    MODAL: '#FFFFFF',
    OVERLAY: 'rgba(0, 0, 0, 0.5)',
  },

  // Text colors
  TEXT: {
    PRIMARY: '#171717',
    SECONDARY: '#525252',
    TERTIARY: '#737373',
    INVERSE: '#FFFFFF',
    DISABLED: '#A3A3A3',
    PLACEHOLDER: '#A3A3A3',
  },

  // Border colors
  BORDER: {
    PRIMARY: '#E5E5E5',
    SECONDARY: '#D4D4D4',
    FOCUS: '#0EA5E9',
    ERROR: '#EF4444',
    SUCCESS: '#10B981',
    WARNING: '#F59E0B',
  },
} as const;

export const DARK_THEME = {
  // Primary colors (same as light)
  PRIMARY: {
    50: '#F0F9FF',
    100: '#E0F2FE',
    200: '#BAE6FD',
    300: '#7DD3FC',
    400: '#38BDF8',
    500: '#0EA5E9',
    600: '#0284C7',
    700: '#0369A1',
    800: '#075985',
    900: '#0C4A6E',
  },

  // Secondary colors (same as light)
  SECONDARY: {
    50: '#FAF5FF',
    100: '#F3E8FF',
    200: '#E9D5FF',
    300: '#D8B4FE',
    400: '#C084FC',
    500: '#A855F7',
    600: '#9333EA',
    700: '#7C3AED',
    800: '#6B21A8',
    900: '#581C87',
  },

  // Accent colors (same as light)
  ACCENT: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },

  // Neutral colors (inverted)
  NEUTRAL: {
    0: '#000000',
    50: '#0A0A0A',
    100: '#171717',
    200: '#262626',
    300: '#404040',
    400: '#525252',
    500: '#737373',
    600: '#A3A3A3',
    700: '#D4D4D4',
    800: '#E5E5E5',
    900: '#F5F5F5',
    1000: '#FFFFFF',
  },

  // Semantic colors (slightly adjusted for dark theme)
  ERROR: {
    50: '#7F1D1D',
    100: '#991B1B',
    200: '#B91C1C',
    300: '#DC2626',
    400: '#EF4444',
    500: '#F87171',  // Main error
    600: '#FCA5A5',
    700: '#FECACA',
    800: '#FEE2E2',
    900: '#FEF2F2',
  },

  WARNING: {
    50: '#78350F',
    100: '#92400E',
    200: '#B45309',
    300: '#D97706',
    400: '#F59E0B',
    500: '#FBBF24',  // Main warning
    600: '#FCD34D',
    700: '#FDE68A',
    800: '#FEF3C7',
    900: '#FFFBEB',
  },

  SUCCESS: {
    50: '#064E3B',
    100: '#065F46',
    200: '#047857',
    300: '#059669',
    400: '#10B981',
    500: '#34D399',  // Main success
    600: '#6EE7B7',
    700: '#A7F3D0',
    800: '#D1FAE5',
    900: '#ECFDF5',
  },

  INFO: {
    50: '#1E3A8A',
    100: '#1E40AF',
    200: '#1D4ED8',
    300: '#2563EB',
    400: '#3B82F6',
    500: '#60A5FA',  // Main info
    600: '#93C5FD',
    700: '#BFDBFE',
    800: '#DBEAFE',
    900: '#EFF6FF',
  },

  // Background colors
  BACKGROUND: {
    PRIMARY: '#000000',
    SECONDARY: '#0A0A0A',
    TERTIARY: '#171717',
    CARD: '#171717',
    MODAL: '#262626',
    OVERLAY: 'rgba(0, 0, 0, 0.8)',
  },

  // Text colors
  TEXT: {
    PRIMARY: '#FFFFFF',
    SECONDARY: '#E5E5E5',
    TERTIARY: '#D4D4D4',
    INVERSE: '#000000',
    DISABLED: '#737373',
    PLACEHOLDER: '#737373',
  },

  // Border colors
  BORDER: {
    PRIMARY: '#404040',
    SECONDARY: '#525252',
    FOCUS: '#0EA5E9',
    ERROR: '#F87171',
    SUCCESS: '#34D399',
    WARNING: '#FBBF24',
  },
} as const;

// Theme context type
export type Theme = typeof LIGHT_THEME;
export type ThemeMode = 'light' | 'dark';

// Component variants
export const COMPONENT_VARIANTS = {
  BUTTON: {
    PRIMARY: 'primary',
    SECONDARY: 'secondary',
    OUTLINE: 'outline',
    GHOST: 'ghost',
    LINK: 'link',
  },
  
  INPUT: {
    DEFAULT: 'default',
    FILLED: 'filled',
    OUTLINE: 'outline',
  },
  
  CARD: {
    DEFAULT: 'default',
    ELEVATED: 'elevated',
    OUTLINED: 'outlined',
  },
  
  BADGE: {
    DEFAULT: 'default',
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error',
    INFO: 'info',
  },

  ALERT: {
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error',
    INFO: 'info',
  },
} as const;

// Component sizes
export const COMPONENT_SIZES = {
  XS: 'xs',
  SM: 'sm',
  MD: 'md',
  LG: 'lg',
  XL: 'xl',
} as const;

// Responsive utilities
export const getResponsiveValue = (
  value: number | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number },
  screenWidth = SCREEN_WIDTH
): number => {
  if (typeof value === 'number') return value;

  if (screenWidth >= DESIGN_SYSTEM.BREAKPOINTS.EXTRA_LARGE && value.xl !== undefined) return value.xl;
  if (screenWidth >= DESIGN_SYSTEM.BREAKPOINTS.LARGE && value.lg !== undefined) return value.lg;
  if (screenWidth >= DESIGN_SYSTEM.BREAKPOINTS.MEDIUM && value.md !== undefined) return value.md;
  if (screenWidth >= DESIGN_SYSTEM.BREAKPOINTS.SMALL && value.sm !== undefined) return value.sm;
  if (value.xs !== undefined) return value.xs;

  return value.md || value.sm || value.xs || 0;
};

// Spacing utilities
export const spacing = (multiplier: number): number => DESIGN_SYSTEM.SPACING.MD * multiplier;

// Typography utilities
export const getTextStyle = (variant: keyof typeof DESIGN_SYSTEM.TYPOGRAPHY.STYLES) => 
  DESIGN_SYSTEM.TYPOGRAPHY.STYLES[variant];

// Color utilities
export const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Export default light theme
export default LIGHT_THEME;
