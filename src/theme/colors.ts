/**
 * Cypher Wallet - Cyber Green Color Palette
 * A modern, vibrant design system for cryptocurrency applications
 */

export const colors = {
  // Primary Palette
  primary: '#22c55e',           // Vibrant Green
  primaryDark: '#16a34a',       // Darker Green
  primaryLight: '#4ade80',      // Lighter Green
  
  // Cyber Green Palette (Enhanced)
  cyberGreen: '#00FF7F',        // Bright Cyber Green
  darkGreen: '#006400',         // Dark Forest Green
  neonGreen: '#39FF14',         // Electric Neon Green
  
  // Secondary Palette  
  secondary: '#3b82f6',         // Electric Blue
  secondaryDark: '#2563eb',     // Darker Blue
  secondaryLight: '#60a5fa',    // Lighter Blue
  
  // Accent Colors
  accent: '#a855f7',            // Purple
  accentDark: '#9333ea',        // Darker Purple
  accentLight: '#c084fc',       // Lighter Purple
  
  // Background Gradients
  bgPrimary: '#0a0a0a',         // Deep Black
  bgSecondary: '#1a1a1a',       // Dark Gray
  bgTertiary: '#2d1b69',        // Dark Purple
  bgQuaternary: '#1e3a8a',      // Dark Blue
  
  // Surface Colors
  surface: 'rgba(15, 15, 15, 0.6)',      // Card Background
  surfaceLight: 'rgba(34, 197, 94, 0.1)', // Light Surface
  surfaceBorder: 'rgba(34, 197, 94, 0.2)', // Border Color
  surfaceGlow: 'rgba(34, 197, 94, 0.3)',   // Glow Effect
  
  // Text Colors
  textPrimary: '#ffffff',        // White
  textSecondary: '#e2e8f0',      // Light Gray
  textTertiary: '#94a3b8',       // Medium Gray
  textMuted: '#64748b',          // Muted Gray
  
  // Status Colors
  success: '#22c55e',            // Green
  warning: '#f59e0b',            // Orange
  error: '#ef4444',              // Red
  info: '#3b82f6',               // Blue
  
  // Transaction Colors
  received: '#22c55e',           // Green
  sent: '#ef4444',               // Red
  swap: '#a855f7',               // Purple
  
  // Transparency Variations
  black: '#000000',
  white: '#ffffff',
  transparent: 'transparent',
  
  // Glass Effect Colors
  glass: {
    primary: 'rgba(34, 197, 94, 0.1)',
    secondary: 'rgba(59, 130, 246, 0.1)',
    accent: 'rgba(168, 85, 247, 0.1)',
    dark: 'rgba(10, 10, 10, 0.8)',
    light: 'rgba(255, 255, 255, 0.1)',
  }
} as const;

// Gradient definitions for consistent use
export const gradients = {
  primary: ['#22c55e', '#3b82f6', '#a855f7'],
  primarySimple: ['#22c55e', '#16a34a'],
  secondary: ['#3b82f6', '#2563eb'],
  accent: ['#a855f7', '#9333ea'],
  
  // Background gradients
  backgroundMain: ['#0a0a0a', '#1a1a1a', '#2d1b69', '#1e3a8a'],
  backgroundCard: ['rgba(15, 15, 15, 0.8)', 'rgba(34, 197, 94, 0.05)'],
  backgroundHeader: ['#0a0a0a', '#2d1b69'],
  
  // Status gradients
  success: ['#22c55e', '#3b82f6'],
  error: ['#ef4444', '#f97316'],
  warning: ['#f59e0b', '#ea580c'],
  info: ['#3b82f6', '#1d4ed8'],
  
  // Chart gradients
  chart: ['#22c55e', '#3b82f6', '#a855f7', '#f59e0b'],
  
  // Glow effects
  glowPrimary: ['rgba(34, 197, 94, 0.4)', 'transparent'],
  glowSecondary: ['rgba(59, 130, 246, 0.4)', 'transparent'],
  glowAccent: ['rgba(168, 85, 247, 0.4)', 'transparent'],
} as const;

// Shadow definitions
export const shadows = {
  small: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  neon: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 15,
  }
} as const;

export type ColorKeys = keyof typeof colors;
export type GradientKeys = keyof typeof gradients;
export type ShadowKeys = keyof typeof shadows;
