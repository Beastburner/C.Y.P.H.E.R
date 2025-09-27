/**
 * THEME MODERNIZER UTILITY
 * Automated theme consistency across all components
 * Ensures uniform modern design language
 */

import { ViewStyle, TextStyle } from 'react-native';
import { ModernColors, ModernSpacing, ModernBorderRadius, ModernShadows } from './ModernTheme';

/**
 * Modern Screen Theme Generator
 * Creates consistent styling for all screen components
 */
export class ModernThemeGenerator {
  
  /**
   * Generate modern header styles
   */
  static createModernHeader(): {
    container: ViewStyle;
    gradient: ViewStyle;
    title: TextStyle;
    backButton: ViewStyle;
    actionButton: ViewStyle;
  } {
    return {
      container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: ModernSpacing.lg,
        paddingVertical: ModernSpacing.md,
        minHeight: 60,
      },
      gradient: {
        paddingTop: 20,
      },
      title: {
        fontSize: 18,
        fontWeight: '600',
        color: ModernColors.textInverse,
      },
      backButton: {
        padding: ModernSpacing.xs,
        borderRadius: ModernBorderRadius.sm,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
      },
      actionButton: {
        padding: ModernSpacing.xs,
        borderRadius: ModernBorderRadius.sm,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
      },
    };
  }

  /**
   * Generate modern card styles
   */
  static createModernCard(variant: 'default' | 'gradient' | 'glass' = 'default'): ViewStyle {
    const baseCard: ViewStyle = {
      backgroundColor: ModernColors.surface,
      borderRadius: ModernBorderRadius.xl,
      padding: ModernSpacing.xl,
      marginBottom: ModernSpacing.lg,
      ...ModernShadows.medium,
    };

    switch (variant) {
      case 'gradient':
        return {
          ...baseCard,
          backgroundColor: 'transparent',
          overflow: 'hidden',
        };
      case 'glass':
        return {
          ...baseCard,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.2)',
        };
      default:
        return baseCard;
    }
  }

  /**
   * Generate modern button styles
   */
  static createModernButton(
    variant: 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'danger' = 'primary'
  ): ViewStyle {
    const baseButton: ViewStyle = {
      paddingVertical: ModernSpacing.md,
      paddingHorizontal: ModernSpacing.lg,
      borderRadius: ModernBorderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      ...ModernShadows.small,
    };

    const colorMap = {
      primary: ModernColors.privacy.enhanced,
      secondary: 'transparent',
      success: ModernColors.success,
      warning: ModernColors.warning,
      info: ModernColors.info,
      danger: ModernColors.error,
    };

    return {
      ...baseButton,
      backgroundColor: colorMap[variant],
      ...(variant === 'secondary' && {
        borderWidth: 1,
        borderColor: ModernColors.border,
      }),
    };
  }

  /**
   * Generate modern input styles
   */
  static createModernInput(): ViewStyle {
    return {
      backgroundColor: ModernColors.surfaceSecondary,
      borderWidth: 1,
      borderColor: ModernColors.border,
      borderRadius: ModernBorderRadius.md,
      paddingHorizontal: ModernSpacing.lg,
      paddingVertical: ModernSpacing.md,
    };
  }

  /**
   * Generate modern tab navigation styles
   */
  static createModernTabs(): {
    container: ViewStyle;
    tab: ViewStyle;
    activeTab: ViewStyle;
    tabText: TextStyle;
    activeTabText: TextStyle;
  } {
    return {
      container: {
        flexDirection: 'row',
        backgroundColor: ModernColors.surface,
        ...ModernShadows.small,
      },
      tab: {
        flex: 1,
        paddingVertical: ModernSpacing.lg,
        alignItems: 'center',
        position: 'relative',
      },
      activeTab: {
        borderBottomWidth: 3,
        borderBottomColor: ModernColors.privacy.enhanced,
      },
      tabText: {
        fontSize: 14,
        color: ModernColors.textSecondary,
        fontWeight: '500',
      },
      activeTabText: {
        color: ModernColors.privacy.enhanced,
        fontWeight: '600',
      },
    };
  }

  /**
   * Generate modern empty state styles
   */
  static createModernEmptyState(): {
    container: ViewStyle;
    text: TextStyle;
    subtext: TextStyle;
  } {
    return {
      container: {
        alignItems: 'center',
        padding: ModernSpacing.xl,
        borderRadius: ModernBorderRadius.md,
        backgroundColor: ModernColors.surfaceSecondary,
      },
      text: {
        textAlign: 'center',
        color: ModernColors.textSecondary,
        fontSize: 14,
        fontStyle: 'italic',
      },
      subtext: {
        textAlign: 'center',
        color: ModernColors.textTertiary,
        fontSize: 12,
        marginTop: ModernSpacing.xs,
      },
    };
  }

  /**
   * Generate modern list item styles
   */
  static createModernListItem(): {
    container: ViewStyle;
    content: ViewStyle;
    title: TextStyle;
    subtitle: TextStyle;
    action: ViewStyle;
  } {
    return {
      container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: ModernSpacing.md,
        borderBottomWidth: 1,
        borderBottomColor: ModernColors.border,
      },
      content: {
        flex: 1,
        marginRight: ModernSpacing.lg,
      },
      title: {
        fontSize: 14,
        color: ModernColors.textPrimary,
        fontWeight: '500',
        marginBottom: ModernSpacing.xs,
      },
      subtitle: {
        fontSize: 12,
        color: ModernColors.textSecondary,
        lineHeight: 16,
      },
      action: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: ModernColors.success + '20',
        paddingHorizontal: ModernSpacing.sm,
        paddingVertical: ModernSpacing.xs,
        borderRadius: ModernBorderRadius.sm,
      },
    };
  }

  /**
   * Generate modern notification styles
   */
  static createModernNotification(type: 'info' | 'success' | 'warning' | 'error' = 'info'): {
    container: ViewStyle;
    text: TextStyle;
  } {
    const colorMap = {
      info: ModernColors.info,
      success: ModernColors.success,
      warning: ModernColors.warning,
      error: ModernColors.error,
    };

    const color = colorMap[type];

    return {
      container: {
        flexDirection: 'row',
        backgroundColor: color + '20',
        borderRadius: ModernBorderRadius.md,
        padding: ModernSpacing.lg,
        alignItems: 'flex-start',
        borderLeftWidth: 4,
        borderLeftColor: color,
      },
      text: {
        flex: 1,
        fontSize: 12,
        color: color,
        marginLeft: ModernSpacing.sm,
        lineHeight: 16,
      },
    };
  }

  /**
   * Generate modern loading states
   */
  static createModernLoadingState(): {
    overlay: ViewStyle;
    container: ViewStyle;
    text: TextStyle;
  } {
    return {
      overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      },
      container: {
        backgroundColor: ModernColors.surface,
        borderRadius: ModernBorderRadius.xl,
        padding: ModernSpacing.xl,
        alignItems: 'center',
        ...ModernShadows.large,
      },
      text: {
        marginTop: ModernSpacing.md,
        color: ModernColors.textPrimary,
        fontSize: 14,
        fontWeight: '500',
      },
    };
  }
}

/**
 * Theme utility functions
 */
export const ThemeUtils = {
  /**
   * Apply opacity to color
   */
  applyOpacity: (color: string, opacity: number): string => {
    const alpha = Math.round(opacity * 255).toString(16).padStart(2, '0');
    return color + alpha;
  },

  /**
   * Get gradient colors for different contexts
   */
  getGradientColors: (context: 'primary' | 'privacy' | 'success' | 'warning' | 'info') => {
    const gradients = {
      primary: ModernColors.primaryGradient,
      privacy: [ModernColors.privacy.enhanced, ModernColors.privacy.enhanced + '80'],
      success: [ModernColors.success, ModernColors.success + '80'],
      warning: [ModernColors.warning, ModernColors.warning + '80'],
      info: [ModernColors.info, ModernColors.info + '80'],
    };
    return gradients[context];
  },

  /**
   * Get responsive spacing
   */
  getResponsiveSpacing: (baseSpacing: number, screenWidth: number) => {
    const scaleFactor = screenWidth / 375; // iPhone X base width
    return Math.round(baseSpacing * Math.min(scaleFactor, 1.2));
  },

  /**
   * Get context-aware colors
   */
  getContextColors: (context: 'privacy' | 'transaction' | 'security' | 'general') => {
    const contexts = {
      privacy: {
        primary: ModernColors.privacy.enhanced,
        secondary: ModernColors.privacy.standard,
        background: ModernColors.privateMode.background,
        text: ModernColors.textInverse,
      },
      transaction: {
        send: ModernColors.transaction.send,
        receive: ModernColors.transaction.receive,
        deposit: ModernColors.transaction.deposit,
        withdraw: ModernColors.transaction.withdraw,
      },
      security: {
        high: ModernColors.success,
        medium: ModernColors.warning,
        low: ModernColors.error,
      },
      general: {
        primary: ModernColors.info,
        secondary: ModernColors.textSecondary,
        background: ModernColors.background,
        surface: ModernColors.surface,
      },
    };
    return contexts[context];
  },
};

export default ModernThemeGenerator;
