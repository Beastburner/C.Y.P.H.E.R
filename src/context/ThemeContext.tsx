/**
 * CYPHER THEME PROVIDER - Revolutionary Design System
 * The world's most advanced multi-chain wallet theme system
 * Professional design for the next generation of Web3
 */

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { StatusBar, Platform } from 'react-native';
import { CypherTheme, Theme, createButtonStyle, createCardStyle, createInputStyle, getGradient, applyOpacity } from '../styles/CypherDesignSystem';

// Enhanced Theme context interface
interface ThemeContextValue {
  theme: Theme;
  colors: typeof CypherTheme.colors;
  gradients: typeof CypherTheme.gradients;
  spacing: typeof CypherTheme.spacing;
  borderRadius: typeof CypherTheme.borderRadius;
  typography: typeof CypherTheme.typography;
  shadows: typeof CypherTheme.shadows;
  animations: typeof CypherTheme.animations;
  components: typeof CypherTheme.components;
  // Direct access to typography properties for backward compatibility
  fontSize: typeof CypherTheme.typography.fontSize;
  fontWeight: typeof CypherTheme.typography.fontWeight;
  // Style generators
  createButtonStyle: typeof createButtonStyle;
  createCardStyle: typeof createCardStyle;
  createInputStyle: typeof createInputStyle;
  getGradient: typeof getGradient;
  applyOpacity: typeof applyOpacity;
}

// Create theme context
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Theme provider props
interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * CYPHER Theme Provider Component
 * Provides revolutionary design system throughout the app
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  // Update status bar for dark theme
  useEffect(() => {
    StatusBar.setBarStyle('light-content', true);
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(CypherTheme.colors.background, true);
    }
  }, []);

  // Enhanced context value with design system utilities
  const contextValue: ThemeContextValue = {
    theme: CypherTheme,
    colors: CypherTheme.colors,
    gradients: CypherTheme.gradients,
    spacing: CypherTheme.spacing,
    borderRadius: CypherTheme.borderRadius,
    typography: CypherTheme.typography,
    shadows: CypherTheme.shadows,
    animations: CypherTheme.animations,
    components: CypherTheme.components,
    // Direct access to typography properties for backward compatibility
    fontSize: CypherTheme.typography.fontSize,
    fontWeight: CypherTheme.typography.fontWeight,
    // Style generators for consistent design
    createButtonStyle,
    createCardStyle,
    createInputStyle,
    getGradient,
    applyOpacity,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to use theme context
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}

/**
 * Hook for theme-aware styles
 */
export function useThemedStyles<T>(
  styleCreator: (theme: Theme) => T
): T {
  const { theme } = useTheme();
  return styleCreator(theme);
}

// Export theme utilities
export { CypherTheme };
export type { Theme, ThemeContextValue };
