import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface SimpleButtonProps {
  title?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

const SimpleButton: React.FC<SimpleButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const theme = useTheme();

  const getButtonStyle = () => {
    const baseStyle = [
      styles.button,
      {
        backgroundColor: variant === 'primary' 
          ? theme.colors.primary 
          : variant === 'secondary' 
          ? theme.colors.secondary 
          : 'transparent',
        borderColor: variant === 'outline' ? theme.colors.primary : 'transparent',
        borderWidth: variant === 'outline' ? 1 : 0,
        opacity: disabled ? 0.5 : 1,
      },
      fullWidth && styles.fullWidth,
      style,
    ];
    return baseStyle;
  };

  const getTextStyle = () => {
    return [
      styles.text,
      {
        color: variant === 'primary' 
          ? theme.colors.textPrimary 
          : variant === 'outline' 
          ? theme.colors.primary 
          : theme.colors.textSecondary,
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.medium,
      },
      textStyle,
    ];
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
          color={variant === 'primary' ? theme.colors.textPrimary : theme.colors.primary} 
          size="small" 
        />
      ) : (
        <Text style={getTextStyle()}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default SimpleButton;
