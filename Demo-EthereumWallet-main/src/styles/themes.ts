export const NavyTheme = {
  colors: {
    // Primary Colors
    primary: '#1E3A8A', // Deep Navy Blue
    primaryDark: '#1E40AF', // Darker Navy
    primaryLight: '#3B82F6', // Lighter Navy Blue
    
    // Secondary Colors
    secondary: '#64748B', // Slate Gray
    secondaryDark: '#475569',
    secondaryLight: '#94A3B8',
    
    // Background Colors
    background: '#0F172A', // Very Dark Navy
    backgroundSecondary: '#1E293B', // Dark Navy
    backgroundTertiary: '#334155', // Medium Navy
    
    // Surface Colors
    surface: '#1E293B',
    surfaceSecondary: '#334155',
    surfaceTertiary: '#475569',
    
    // Text Colors
    textPrimary: '#F8FAFC', // Almost White
    textSecondary: '#CBD5E1', // Light Gray
    textTertiary: '#94A3B8', // Medium Gray
    textDisabled: '#64748B',
    
    // Accent Colors
    accent: '#3B82F6', // Bright Blue
    accentSecondary: '#06B6D4', // Cyan
    
    // Status Colors
    success: '#10B981', // Green
    successLight: '#34D399',
    warning: '#F59E0B', // Amber
    warningLight: '#FBBF24',
    error: '#EF4444', // Red
    errorLight: '#F87171',
    info: '#3B82F6', // Blue
    infoLight: '#60A5FA',
    
    // Border Colors
    border: '#334155',
    borderLight: '#475569',
    borderDark: '#1E293B',
    
    // Overlay Colors
    overlay: 'rgba(15, 23, 42, 0.8)', // Dark Navy with opacity
    overlayLight: 'rgba(30, 41, 59, 0.6)',
    
    // Card Colors
    card: '#1E293B',
    cardSecondary: '#334155',
    
    // Input Colors
    input: '#334155',
    inputFocused: '#475569',
    inputDisabled: '#1E293B',
    
    // Button Colors
    buttonPrimary: '#3B82F6',
    buttonPrimaryHover: '#2563EB',
    buttonSecondary: '#475569',
    buttonSecondaryHover: '#64748B',
    buttonDanger: '#EF4444',
    buttonDangerHover: '#DC2626',
    
    // Gradient Colors
    gradientStart: '#1E3A8A',
    gradientMiddle: '#3B82F6',
    gradientEnd: '#06B6D4',
  },
  
  gradients: {
    primary: ['#1E3A8A', '#3B82F6'],
    secondary: ['#334155', '#475569'],
    accent: ['#3B82F6', '#06B6D4'],
    success: ['#10B981', '#34D399'],
    warning: ['#F59E0B', '#FBBF24'],
    error: ['#EF4444', '#F87171'],
    background: ['#0F172A', '#1E293B'],
    card: ['#1E293B', '#334155'],
  },
  
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 3,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 10,
    },
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    round: 50,
  },
  
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  
  fontWeight: {
    light: '300' as const,
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  
  animations: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
};

export type Theme = typeof NavyTheme;
export default NavyTheme;
