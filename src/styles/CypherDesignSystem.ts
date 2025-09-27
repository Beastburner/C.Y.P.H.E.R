/**
 * CYPHER Design System
 * Professional multi-chain wallet design system
 * Enhanced colors, typography, spacing, and component styles
 */

// Brand Color Palette - CYPHER Professional Theme
const CypherBrand = {
  // Primary Brand Colors - Professional Purple/Blue gradient
  primary: {
    50: '#EEF2FF',
    100: '#E0E7FF', 
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1', // Main brand color
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
    950: '#1E1B4B'
  },
  
  // Revolutionary Navy Theme for backgrounds
  navy: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
    950: '#020617'
  },
  
  // Accent Colors for CTAs and highlights
  accent: {
    cyan: '#06B6D4',
    emerald: '#10B981',
    amber: '#F59E0B',
    rose: '#F43F5E',
    purple: '#8B5CF6'
  },
  
  // Status Colors
  status: {
    success: '#10B981',
    warning: '#F59E0B', 
    error: '#EF4444',
    info: '#3B82F6'
  }
};

const CypherDesignSystem = {
  // Semantic Colors - Enhanced for CYPHER branding
  colors: {
    // Brand Colors
    primary: CypherBrand.primary[600],
    primaryLight: CypherBrand.primary[400],
    primaryDark: CypherBrand.primary[800],
    
    // Background System
    background: CypherBrand.navy[950],
    backgroundSecondary: CypherBrand.navy[900],
    backgroundTertiary: CypherBrand.navy[800],
    backgroundCard: CypherBrand.navy[800],
    backgroundModal: CypherBrand.navy[900],
    
    // Surface System
    surface: CypherBrand.navy[800],
    surfaceSecondary: CypherBrand.navy[700],
    surfaceElevated: CypherBrand.navy[600],
    surfacePressed: CypherBrand.navy[500],
    
    // Text System
    textPrimary: CypherBrand.navy[50],
    textSecondary: CypherBrand.navy[300],
    textTertiary: CypherBrand.navy[400],
    textDisabled: CypherBrand.navy[500],
    textInverse: CypherBrand.navy[950],
    
    // Interactive Colors
    interactive: CypherBrand.primary[600],
    interactiveHover: CypherBrand.primary[500],
    interactivePressed: CypherBrand.primary[700],
    interactiveDisabled: CypherBrand.navy[600],
    secondary: CypherBrand.primary[400], // Add secondary color
    
    // Status Colors
    success: CypherBrand.status.success,
    successLight: '#6EE7B7', // Add light success color
    warning: CypherBrand.status.warning,
    error: CypherBrand.status.error,
    info: CypherBrand.status.info,
    
    // Accent Colors
    accent: CypherBrand.accent.cyan,
    accentSecondary: CypherBrand.accent.emerald,
    
    // Border System
    border: CypherBrand.navy[700],
    borderSecondary: CypherBrand.navy[600],
    borderFocus: CypherBrand.primary[500],
    borderError: CypherBrand.status.error,
    
    // Chart Colors for Analytics
    chart: {
      primary: CypherBrand.primary[500],
      secondary: CypherBrand.accent.cyan,
      tertiary: CypherBrand.accent.emerald,
      quaternary: CypherBrand.accent.amber,
      quinary: CypherBrand.accent.rose,
    },
  },

  // Typography System - Professional and readable
  typography: {
    fontFamily: {
      primary: 'System',
      secondary: 'System',
      mono: 'Monaco',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
      '5xl': 48,
      '6xl': 60,
      base: 16,
      xxl: 72,
      xxxl: 96,
    },
    fontWeight: {
      light: '300' as const,
      normal: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
      extrabold: '800' as const,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  // Spacing System - Consistent and scalable
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
    '4xl': 96,
    xxl: 128,
    1: 4,
    2: 8,
    4: 16,
    6: 24,
    8: 32,
    12: 48,
  },

  // Border Radius System
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 24,
    full: 9999,
  },

  // Shadow System - Elevated UI elements
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.18,
      shadowRadius: 1.0,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
      elevation: 8,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.44,
      shadowRadius: 10.32,
      elevation: 16,
    },
    // Legacy naming for compatibility
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.18,
      shadowRadius: 1.0,
      elevation: 1,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
      elevation: 8,
    },
  },

  // Gradient System
  gradients: {
    primary: ['#6366F1', '#4F46E5', '#4338CA'],
    secondary: ['#06B6D4', '#0891B2', '#0E7490'],
    success: ['#10B981', '#059669', '#047857'],
    warning: ['#F59E0B', '#D97706', '#B45309'],
    error: ['#EF4444', '#DC2626', '#B91C1C'],
    accent: ['#8B5CF6', '#7C3AED', '#6D28D9'],
    background: ['#0F172A', '#1E293B', '#334155'],
    card: ['#1E293B', '#334155', '#475569'],
  },

  // Animation System (rename from animation to animations for compatibility)
  animations: {
    duration: {
      fast: 150,
      normal: 300,
      slow: 500,
    },
    easing: {
      linear: 'linear',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
    },
  },

  // Component Styles
  components: {
    button: {
      height: {
        sm: 32,
        md: 44,
        lg: 52,
      },
      padding: {
        sm: { paddingHorizontal: 12, paddingVertical: 6 },
        md: { paddingHorizontal: 16, paddingVertical: 12 },
        lg: { paddingHorizontal: 24, paddingVertical: 16 },
      },
    },
    card: {
      padding: 16,
      borderRadius: 12,
      backgroundColor: CypherBrand.navy[800],
    },
    input: {
      height: 48,
      padding: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: CypherBrand.navy[600],
      backgroundColor: CypherBrand.navy[800],
    },
  },

  // Layout System
  layout: {
    container: {
      paddingHorizontal: 16,
    },
    screen: {
      paddingTop: 50, // Account for status bar
      paddingHorizontal: 16,
    },
  },

  // Icon Sizes
  iconSizes: {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
    '2xl': 48,
  },
};

// Button Style Factory
export const createButtonStyle = (variant: 'primary' | 'secondary' | 'ghost' = 'primary', size: 'sm' | 'md' | 'lg' = 'md') => ({
  ...CypherDesignSystem.components.button.padding[size],
  height: CypherDesignSystem.components.button.height[size],
  borderRadius: CypherDesignSystem.borderRadius.lg,
  backgroundColor: variant === 'primary' ? CypherBrand.primary[600] : 
                   variant === 'secondary' ? CypherBrand.navy[700] : 'transparent',
  borderWidth: variant === 'ghost' ? 1 : 0,
  borderColor: variant === 'ghost' ? CypherBrand.primary[500] : 'transparent'
});

// Card Style Factory  
export const createCardStyle = (variant: 'default' | 'elevated' = 'default') => ({
  borderWidth: 1,
  ...CypherDesignSystem.components.card,
  ...(variant === 'elevated' ? CypherDesignSystem.shadows.lg : {})
});

// Input Style Factory
export const createInputStyle = (state: 'default' | 'focused' | 'error' = 'default') => ({
  borderRadius: CypherDesignSystem.borderRadius.lg,
  borderWidth: 1,
  paddingHorizontal: CypherDesignSystem.spacing.md,
  paddingVertical: CypherDesignSystem.spacing.sm,
  fontSize: CypherDesignSystem.typography.fontSize.md,
  backgroundColor: CypherBrand.navy[800],
  borderColor: state === 'focused' ? CypherBrand.primary[500] : 
               state === 'error' ? CypherBrand.status.error : CypherBrand.navy[600]
});

// Utility Functions
export const getGradient = (colors: string[]) => ({
  colors,
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 }
});

export const applyOpacity = (color: string, opacity: number) => {
  return color + Math.round(opacity * 255).toString(16).padStart(2, '0');
};

// Main Theme Export
export const CypherTheme = CypherDesignSystem;
export type Theme = typeof CypherDesignSystem;
export default CypherDesignSystem;
