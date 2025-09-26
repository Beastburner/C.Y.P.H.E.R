/**
 * Cypher Wallet - Typography System
 * Consistent typography scale for the Cyber Green theme
 */

import { TextStyle } from 'react-native';

export const typography = {
  // Headers
  h1: {
    fontSize: 32,
    fontWeight: '800' as TextStyle['fontWeight'],
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as TextStyle['fontWeight'],
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 24,
    letterSpacing: -0.1,
  },
  
  // Body Text
  bodyLarge: {
    fontSize: 16,
    fontWeight: '500' as TextStyle['fontWeight'],
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 20,
    letterSpacing: 0,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 16,
    letterSpacing: 0.1,
  },
  
  // Special Typography
  caption: {
    fontSize: 11,
    fontWeight: '500' as TextStyle['fontWeight'],
    lineHeight: 14,
    letterSpacing: 1,
    textTransform: 'uppercase' as TextStyle['textTransform'],
  },
  button: {
    fontSize: 14,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 18,
    letterSpacing: 0.5,
  },
  label: {
    fontSize: 13,
    fontWeight: '500' as TextStyle['fontWeight'],
    lineHeight: 16,
    letterSpacing: 0.2,
  },
  
  // Special Brand Typography
  brand: {
    fontSize: 28,
    fontWeight: '800' as TextStyle['fontWeight'],
    lineHeight: 32,
    letterSpacing: -0.8,
  },
  hero: {
    fontSize: 48,
    fontWeight: '900' as TextStyle['fontWeight'],
    lineHeight: 52,
    letterSpacing: -1.2,
  },
  
  // Numeric Typography (for prices, balances)
  number: {
    fontSize: 18,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 22,
    letterSpacing: 0,
    fontVariant: ['tabular-nums'] as TextStyle['fontVariant'],
  },
  numberLarge: {
    fontSize: 32,
    fontWeight: '700' as TextStyle['fontWeight'],
    lineHeight: 36,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'] as TextStyle['fontVariant'],
  },
  numberSmall: {
    fontSize: 14,
    fontWeight: '500' as TextStyle['fontWeight'],
    lineHeight: 18,
    letterSpacing: 0.1,
    fontVariant: ['tabular-nums'] as TextStyle['fontVariant'],
  },
} as const;

// Font families (customize based on your font requirements)
export const fontFamilies = {
  regular: 'System', // Default system font
  medium: 'System', // System medium weight
  bold: 'System', // System bold weight
  mono: 'Courier', // Monospace for addresses/hashes
} as const;

export type TypographyKeys = keyof typeof typography;
export type FontFamilyKeys = keyof typeof fontFamilies;
