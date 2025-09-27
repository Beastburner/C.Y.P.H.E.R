/**
 * Cypher Wallet - Spacing System
 * Consistent spacing scale for layouts and components
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  full: 9999,
} as const;

export const layout = {
  // Header heights
  headerHeight: 120,
  tabBarHeight: 80,
  statusBarHeight: 44,
  
  // Content spacing
  screenPadding: spacing.md,
  cardPadding: spacing.lg,
  sectionSpacing: spacing.xl,
  
  // Component dimensions
  buttonHeight: 52,
  inputHeight: 48,
  iconSize: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 40,
    xxl: 48,
  },
  
  // FAB (Floating Action Button)
  fabSize: 64,
  fabBottom: 110,
  fabRight: 24,
  
  // Touch targets
  minTouchTarget: 44,
  
  // Grid system
  gridGap: spacing.md,
  gridColumns: 4,
} as const;

// Animation timings
export const timing = {
  fast: 150,
  normal: 300,
  slow: 600,
  slower: 900,
} as const;

// Animation easing curves
export const easing = {
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

export type SpacingKeys = keyof typeof spacing;
export type BorderRadiusKeys = keyof typeof borderRadius;
export type LayoutKeys = keyof typeof layout;
export type TimingKeys = keyof typeof timing;
export type EasingKeys = keyof typeof easing;
