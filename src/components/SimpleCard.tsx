/**
 * Simple Card Component for Dark Theme
 * Replaces the complex Card component with a simpler version using new theme
 */

import React from 'react';
import { View, ViewProps, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface SimpleCardProps extends ViewProps {
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  margin?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  onPress?: () => void;
}

const SimpleCard: React.FC<SimpleCardProps> = ({
  padding = 'md',
  margin = 'md',
  children,
  onPress,
  style,
  ...props
}) => {
  const { colors, spacing, borderRadius, shadows } = useTheme();

  const getPaddingSize = (size: string) => {
    switch (size) {
      case 'none': return 0;
      case 'xs': return spacing.xs;
      case 'sm': return spacing.sm;
      case 'lg': return spacing.lg;
      case 'xl': return spacing.xl;
      default: return spacing.md;
    }
  };

  const getMarginSize = (size: string) => {
    switch (size) {
      case 'none': return 0;
      case 'xs': return spacing.xs;
      case 'sm': return spacing.sm;
      case 'lg': return spacing.lg;
      case 'xl': return spacing.xl;
      default: return spacing.md;
    }
  };

  const cardStyle = {
    backgroundColor: colors.backgroundTertiary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: getPaddingSize(padding),
    margin: getMarginSize(margin),
    ...shadows.medium,
  };

  if (onPress) {
    return (
      <TouchableOpacity
        style={[cardStyle, style]}
        onPress={onPress}
        activeOpacity={0.8}
        {...props}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={[cardStyle, style]}
      {...props}
    >
      {children}
    </View>
  );
};

export default SimpleCard;
