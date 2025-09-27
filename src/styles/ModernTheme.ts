import { StyleSheet } from 'react-native';

export const ModernColors = {
  // Primary gradients
  primaryGradient: ['#0f172a', '#6b46c1', '#0f172a'], // slate-900, purple-600, slate-900
  cardGradient: ['#ffffff', '#f8fafc'], // white to slate-50
  
  // Background colors
  background: '#f1f5f9', // slate-100
  surface: '#ffffff',
  surfaceSecondary: '#f8fafc', // slate-50
  
  // Privacy mode colors
  privateMode: {
    background: ['#1e1b4b', '#581c87', '#1e1b4b'], // indigo-900, purple-900, indigo-900
    accent: '#8b5cf6', // violet-500
    text: '#ffffff',
  },
  
  publicMode: {
    background: ['#0f172a', '#1e40af', '#0f172a'], // slate-900, blue-700, slate-900
    accent: '#3b82f6', // blue-500
    text: '#ffffff',
  },
  
  // Status colors
  success: '#10b981', // emerald-500
  warning: '#f59e0b', // amber-500
  error: '#ef4444', // red-500
  info: '#3b82f6', // blue-500
  
  // Text colors
  textPrimary: '#0f172a', // slate-900
  textSecondary: '#64748b', // slate-500
  textTertiary: '#94a3b8', // slate-400
  textInverse: '#ffffff',
  
  // Border and divider
  border: '#e2e8f0', // slate-200
  divider: '#f1f5f9', // slate-100
  
  // Privacy indicators
  privacy: {
    enhanced: '#8b5cf6', // violet-500
    standard: '#3b82f6', // blue-500
    basic: '#6b7280', // gray-500
  },
  
  // Transaction type colors
  transaction: {
    send: '#ef4444', // red-500
    receive: '#10b981', // emerald-500
    deposit: '#3b82f6', // blue-500
    withdraw: '#8b5cf6', // violet-500
  }
};

export const ModernSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const ModernBorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const ModernShadows = {
  small: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  }
};

export const ModernTypography = {
  // Headers
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
    color: ModernColors.textPrimary,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
    color: ModernColors.textPrimary,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
    color: ModernColors.textPrimary,
  },
  h4: {
    fontSize: 18,
    fontWeight: '500' as const,
    lineHeight: 24,
    color: ModernColors.textPrimary,
  },
  
  // Body text
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    color: ModernColors.textPrimary,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    color: ModernColors.textSecondary,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    color: ModernColors.textTertiary,
  },
  
  // Special text
  caption: {
    fontSize: 10,
    fontWeight: '400' as const,
    lineHeight: 14,
    color: ModernColors.textTertiary,
  },
  mono: {
    fontSize: 12,
    fontWeight: '400' as const,
    fontFamily: 'monospace',
    lineHeight: 16,
    color: ModernColors.textSecondary,
  },
  
  // Button text
  buttonLarge: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  buttonMedium: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
};

export const ModernStyles = StyleSheet.create({
  // Container styles
  safeArea: {
    flex: 1,
    backgroundColor: ModernColors.background,
  },
  
  container: {
    flex: 1,
    backgroundColor: ModernColors.background,
  },
  
  // Card styles
  modernCard: {
    backgroundColor: ModernColors.surface,
    borderRadius: ModernBorderRadius.xl,
    padding: ModernSpacing.xl,
    marginHorizontal: ModernSpacing.lg,
    marginVertical: ModernSpacing.sm,
    ...ModernShadows.medium,
  },
  
  glassmorphicCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: ModernBorderRadius.xl,
    padding: ModernSpacing.xl,
    marginHorizontal: ModernSpacing.lg,
    marginVertical: ModernSpacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...ModernShadows.medium,
  },
  
  // Button styles
  primaryButton: {
    backgroundColor: ModernColors.info,
    borderRadius: ModernBorderRadius.md,
    paddingVertical: ModernSpacing.md,
    paddingHorizontal: ModernSpacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...ModernShadows.small,
  },
  
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: ModernBorderRadius.md,
    paddingVertical: ModernSpacing.md,
    paddingHorizontal: ModernSpacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ModernColors.border,
  },
  
  // Privacy mode styles
  privateModeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(139, 92, 246, 0.1)', // violet overlay
    borderRadius: ModernBorderRadius.xl,
  },
  
  // Input styles
  modernInput: {
    backgroundColor: ModernColors.surface,
    borderRadius: ModernBorderRadius.md,
    paddingHorizontal: ModernSpacing.lg,
    paddingVertical: ModernSpacing.md,
    borderWidth: 1,
    borderColor: ModernColors.border,
    fontSize: 16,
    color: ModernColors.textPrimary,
  },
  
  // Layout helpers
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  spaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Spacing utilities
  mt_xs: { marginTop: ModernSpacing.xs },
  mt_sm: { marginTop: ModernSpacing.sm },
  mt_md: { marginTop: ModernSpacing.md },
  mt_lg: { marginTop: ModernSpacing.lg },
  mt_xl: { marginTop: ModernSpacing.xl },
  
  mb_xs: { marginBottom: ModernSpacing.xs },
  mb_sm: { marginBottom: ModernSpacing.sm },
  mb_md: { marginBottom: ModernSpacing.md },
  mb_lg: { marginBottom: ModernSpacing.lg },
  mb_xl: { marginBottom: ModernSpacing.xl },
  
  mx_sm: { marginHorizontal: ModernSpacing.sm },
  mx_md: { marginHorizontal: ModernSpacing.md },
  mx_lg: { marginHorizontal: ModernSpacing.lg },
  mx_xl: { marginHorizontal: ModernSpacing.xl },
  
  p_sm: { padding: ModernSpacing.sm },
  p_md: { padding: ModernSpacing.md },
  p_lg: { padding: ModernSpacing.lg },
  p_xl: { padding: ModernSpacing.xl },
});

export default {
  Colors: ModernColors,
  Spacing: ModernSpacing,
  BorderRadius: ModernBorderRadius,
  Shadows: ModernShadows,
  Typography: ModernTypography,
  Styles: ModernStyles,
};
