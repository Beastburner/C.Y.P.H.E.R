/**
 * Cypher Wallet - Main Theme Export
 * Central theme configuration for the Cyber Green design system
 */

import { colors, gradients, shadows } from './colors';
import { typography } from './typography';
import { spacing, borderRadius, layout, timing, easing } from './layout';
import { animations, stagger, startupSequence } from './animations';

export const theme = {
  colors,
  gradients,
  shadows,
  typography,
  spacing,
  borderRadius,
  layout,
  timing,
  easing,
  animations,
  stagger,
  startupSequence,
} as const;

// Theme type for TypeScript
export type Theme = typeof theme;

// Common component styles
export const commonStyles = {
  // Glass morphism effect
  glass: {
    backgroundColor: colors.glass.dark,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  
  // Neon glow effect
  neonGlow: {
    ...shadows.glow,
  },
  
  // Card base style
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.medium,
  },
  
  // Button base styles
  button: {
    height: layout.buttonHeight,
    borderRadius: borderRadius.md,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.lg,
  },
  
  // Input base styles
  input: {
    height: layout.inputHeight,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.glass.dark,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    color: colors.textPrimary,
    ...typography.bodyMedium,
  },
  
  // Screen container
  screen: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    paddingHorizontal: layout.screenPadding,
  },
  
  // Safe area
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  
  // Center content
  center: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  
  // Flex row
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  
  // Flex between
  between: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  
  // Shadow styles
  shadowSmall: shadows.small,
  shadowMedium: shadows.medium,
  shadowLarge: shadows.large,
  shadowGlow: shadows.glow,
  shadowNeon: shadows.neon,
} as const;

// Export individual theme parts for easier imports
export {
  colors,
  gradients,
  shadows,
  typography,
  spacing,
  borderRadius,
  layout,
  timing,
  easing,
  animations,
  stagger,
  startupSequence,
};

// Export theme as default
export default theme;
