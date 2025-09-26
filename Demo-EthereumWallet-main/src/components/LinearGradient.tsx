import React from 'react';
import { View, ViewStyle } from 'react-native';
import LinearGradientLib from 'react-native-linear-gradient';
import { useTheme } from '../context/ThemeContext';

interface LinearGradientProps {
  children?: React.ReactNode;
  colors?: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  style?: ViewStyle | ViewStyle[];
  variant?: 'primary' | 'secondary' | 'accent' | 'background' | 'card' | 'success' | 'error' | 'warning';
}

const LinearGradient: React.FC<LinearGradientProps> = ({
  children,
  colors: customColors,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
  style,
  variant = 'primary',
}) => {
  const { gradients } = useTheme();
  
  const getGradientColors = () => {
    if (customColors) return customColors;
    
    switch (variant) {
      case 'primary':
        return gradients.primary;
      case 'secondary':
        return gradients.secondary;
      case 'accent':
        return gradients.accent;
      case 'background':
        return gradients.background;
      case 'card':
        return gradients.card;
      case 'success':
        return gradients.success;
      case 'error':
        return gradients.error;
      case 'warning':
        return gradients.warning;
      default:
        return gradients.primary;
    }
  };

  return (
    <LinearGradientLib
      colors={[...getGradientColors()]}
      start={start}
      end={end}
      style={style}
    >
      {children}
    </LinearGradientLib>
  );
};

export default LinearGradient;
