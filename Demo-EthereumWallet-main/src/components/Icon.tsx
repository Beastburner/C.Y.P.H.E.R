import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface IconProps {
  icon: string;
  size?: number;
  color?: string;
}

const Icon: React.FC<IconProps> = ({ icon, size = 24, color = colors.textPrimary }) => {
  const getIconContent = (iconName: string) => {
    switch (iconName) {
      case 'settings':
        return '⚙';
      case 'copy':
        return '📋';
      case 'eye':
        return '👁';
      case 'send':
        return '↗';
      case 'receive':
        return '↙';
      case 'refresh':
        return '🔄';
      case 'globe':
        return '🌐';
      case 'wallet':
        return '💳';
      case 'chart':
        return '📊';
      case 'history':
        return '📜';
      case 'add':
        return '+';
      case 'close':
        return '×';
      case 'check':
        return '✓';
      case 'arrow-right':
        return '→';
      case 'arrow-left':
        return '←';
      case 'arrow-up':
        return '↑';
      case 'arrow-down':
        return '↓';
      case 'more':
        return '•••';
      default:
        return '?';
    }
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Text style={[styles.icon, { fontSize: size * 0.8, color }]}>
        {getIconContent(icon)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    textAlign: 'center',
  },
});

export default Icon;
