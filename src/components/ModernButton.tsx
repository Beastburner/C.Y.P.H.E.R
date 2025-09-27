import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { ModernColors, ModernSpacing, ModernBorderRadius, ModernShadows } from '../styles/ModernTheme';

interface ModernButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  gradient?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const ModernButton: React.FC<ModernButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  gradient = false,
  fullWidth = false,
  style,
  textStyle,
}) => {
  const getButtonStyle = () => {
    const baseStyle: ViewStyle[] = [styles.button, styles[size], fullWidth && styles.fullWidth].filter(Boolean) as ViewStyle[];
    
    if (disabled) {
      baseStyle.push(styles.disabled);
    } else {
      baseStyle.push(styles[variant] as ViewStyle);
    }
    
    return [...baseStyle, style].filter(Boolean) as ViewStyle[];
  };

  const getTextStyle = () => {
    const baseTextStyle: TextStyle[] = [styles.buttonText, styles[`${size}Text`] as TextStyle].filter(Boolean) as TextStyle[];
    
    if (disabled) {
      baseTextStyle.push(styles.disabledText);
    } else {
      baseTextStyle.push(styles[`${variant}Text`] as TextStyle);
    }
    
    return [...baseTextStyle, textStyle].filter(Boolean) as TextStyle[];
  };

  const ButtonContent = () => (
    <View style={styles.buttonContent}>
      {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
      <Text style={getTextStyle()}>
        {loading ? 'Loading...' : title}
      </Text>
      {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
    </View>
  );

  if (gradient && variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        style={[styles.gradientButton, fullWidth && styles.fullWidth, style]}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#3b82f6', '#6366f1', '#8b5cf6']} // blue-500 to indigo-500 to violet-500
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradientContent, styles[size]]}
        >
          <ButtonContent />
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={getButtonStyle()}
      activeOpacity={0.8}
    >
      <ButtonContent />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: ModernBorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...ModernShadows.small,
  },
  
  gradientButton: {
    borderRadius: ModernBorderRadius.md,
    overflow: 'hidden',
    ...ModernShadows.medium,
  },
  
  gradientContent: {
    borderRadius: ModernBorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  leftIcon: {
    marginRight: ModernSpacing.sm,
  },
  
  rightIcon: {
    marginLeft: ModernSpacing.sm,
  },
  
  // Size variants
  small: {
    paddingVertical: ModernSpacing.sm,
    paddingHorizontal: ModernSpacing.md,
  },
  
  medium: {
    paddingVertical: ModernSpacing.md,
    paddingHorizontal: ModernSpacing.xl,
  },
  
  large: {
    paddingVertical: ModernSpacing.lg,
    paddingHorizontal: ModernSpacing.xxl,
  },
  
  fullWidth: {
    width: '100%',
  },
  
  // Color variants
  primary: {
    backgroundColor: ModernColors.info,
  },
  
  secondary: {
    backgroundColor: ModernColors.surface,
    borderWidth: 1,
    borderColor: ModernColors.border,
  },
  
  success: {
    backgroundColor: ModernColors.success,
  },
  
  warning: {
    backgroundColor: ModernColors.warning,
  },
  
  error: {
    backgroundColor: ModernColors.error,
  },
  
  ghost: {
    backgroundColor: 'transparent',
  },
  
  disabled: {
    backgroundColor: ModernColors.border,
  },
  
  // Text styles
  buttonText: {
    fontWeight: '600',
  },
  
  smallText: {
    fontSize: 14,
  },
  
  mediumText: {
    fontSize: 16,
  },
  
  largeText: {
    fontSize: 18,
  },
  
  // Text color variants
  primaryText: {
    color: ModernColors.textInverse,
  },
  
  secondaryText: {
    color: ModernColors.textPrimary,
  },
  
  successText: {
    color: ModernColors.textInverse,
  },
  
  warningText: {
    color: ModernColors.textInverse,
  },
  
  errorText: {
    color: ModernColors.textInverse,
  },
  
  ghostText: {
    color: ModernColors.info,
  },
  
  disabledText: {
    color: ModernColors.textTertiary,
  },
});

export default ModernButton;
