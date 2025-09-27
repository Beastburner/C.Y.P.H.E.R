import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  GestureResponderEvent,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface ButtonProps {
  title?: string;
  onPress: (event: GestureResponderEvent) => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'error';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  fullWidth = false,
  children,
}) => {
  const { colors, spacing, fontSize, fontWeight, borderRadius } = useTheme();

  const getButtonStyle = (): ViewStyle => {
    let backgroundColor = colors.primary;
    let borderColor = 'transparent';
    let borderWidth = 0;

    switch (variant) {
      case 'primary':
        backgroundColor = colors.primary;
        break;
      case 'secondary':
        backgroundColor = colors.secondary;
        break;
      case 'success':
        backgroundColor = colors.success;
        break;
      case 'error':
        backgroundColor = colors.error;
        break;
      case 'outline':
        backgroundColor = 'transparent';
        borderColor = colors.primary;
        borderWidth = 1;
        break;
      case 'ghost':
        backgroundColor = 'transparent';
        break;
    }

    let paddingHorizontal = spacing.md;
    let height = 48;
    let textSize = fontSize.md;

    switch (size) {
      case 'small':
        paddingHorizontal = spacing.sm;
        height = 40;
        textSize = fontSize.sm;
        break;
      case 'large':
        paddingHorizontal = spacing.xl;
        height = 56;
        textSize = fontSize.lg;
        break;
    }

    return {
      backgroundColor,
      borderColor,
      borderWidth,
      paddingHorizontal,
      height,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      opacity: disabled ? 0.5 : 1,
      width: fullWidth ? '100%' : 'auto',
      ...style,
    };
  };

  const getTextStyle = (): TextStyle => {
    let color = colors.textPrimary;

    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'success':
      case 'error':
        color = colors.textPrimary;
        break;
      case 'outline':
        color = colors.primary;
        break;
      case 'ghost':
        color = colors.textSecondary;
        break;
    }

    return {
      color,
      fontSize: fontSize.md,
      fontWeight: fontWeight.medium,
      textAlign: 'center',
      ...textStyle,
    };
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.textPrimary} 
          size="small" 
        />
      ) : (
        <>
          {children || <Text style={getTextStyle()}>{title}</Text>}
        </>
      )}
    </TouchableOpacity>
  );
};

export default Button;
