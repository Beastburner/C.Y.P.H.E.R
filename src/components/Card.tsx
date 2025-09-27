import React, { useRef, useEffect } from 'react';
import { View, ViewProps, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface CardProps extends ViewProps {
  variant?: 'glass' | 'neon' | 'gradient' | 'surface' | 'glow' | 'outline';
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  margin?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  gradientColors?: string[];
  onPress?: () => void;
  glowEffect?: boolean;
  shimmerEffect?: boolean;
  animated?: boolean;
  borderGlow?: boolean;
}

const Card: React.FC<CardProps> = ({
  variant = 'glass',
  padding = 'md',
  margin = 'md',
  children,
  gradientColors,
  onPress,
  glowEffect = false,
  shimmerEffect = false,
  animated = false,
  borderGlow = false,
  style,
  ...props
}) => {
  const { colors, spacing, borderRadius, shadows } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (glowEffect) {
      const glowAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: false,
          }),
        ])
      );
      glowAnimation.start();
      return () => glowAnimation.stop();
    }
    return undefined;
  }, [glowEffect, glowAnim]);

  useEffect(() => {
    if (shimmerEffect) {
      const shimmerAnimation = Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      );
      shimmerAnimation.start();
      return () => shimmerAnimation.stop();
    }
    return undefined;
  }, [shimmerEffect, shimmerAnim]);

  const handlePressIn = () => {
    if (animated && onPress) {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (animated && onPress) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  };

  const getCardPadding = (): number => {
    switch (padding) {
      case 'none': return 0;
      case 'xs': return spacing.xs;
      case 'sm': return spacing.sm;
      case 'lg': return spacing.lg;
      case 'xl': return spacing.xl;
      default: return spacing.md;
    }
  };

  const getCardMargin = (): number => {
    switch (margin) {
      case 'none': return 0;
      case 'xs': return spacing.xs;
      case 'sm': return spacing.sm;
      case 'lg': return spacing.lg;
      case 'xl': return spacing.xl;
      default: return spacing.md;
    }
  };

  const getCardStyles = () => {
    const baseStyle = {
      padding: getCardPadding(),
      margin: getCardMargin(),
      borderRadius: borderRadius.lg,
      overflow: 'hidden' as const,
    };

    switch (variant) {
      case 'glass':
        return {
          ...baseStyle,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          ...shadows.medium,
        };
      case 'neon':
        return {
          ...baseStyle,
          backgroundColor: colors.surface,
          borderWidth: 2,
          borderColor: colors.primary,
          ...shadows.large,
          shadowColor: colors.primary,
        };
      case 'gradient':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          ...shadows.large,
        };
      case 'surface':
        return {
          ...baseStyle,
          backgroundColor: colors.surfaceSecondary,
          borderWidth: 1,
          borderColor: colors.border,
          ...shadows.small,
        };
      case 'glow':
        return {
          ...baseStyle,
          backgroundColor: colors.surface,
          ...shadows.large,
          shadowColor: colors.primary,
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: colors.border,
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: colors.surface,
          ...shadows.medium,
        };
    }
  };

  const cardStyles = getCardStyles();

  const animatedGlowStyle = glowEffect ? {
    shadowOpacity: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.2, 0.8],
    }),
    elevation: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [4, 15],
    }),
  } : {};

  const animatedBorderStyle = borderGlow ? {
    borderColor: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [colors.border, colors.primary],
    }),
  } : {};

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

  const CardContent = () => (
    <Animated.View style={[cardStyles, animatedGlowStyle, animatedBorderStyle, style]} {...props}>
      {shimmerEffect && (
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              transform: [{ translateX: shimmerTranslate }],
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              opacity: 0.5,
            },
          ]}
        />
      )}
      
      {variant === 'gradient' && (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: colors.primary,
              opacity: 0.1,
            },
          ]}
        />
      )}
      
      {children}
    </Animated.View>
  );

  if (onPress) {
    return (
      <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
        >
          <CardContent />
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return animated ? (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
      <CardContent />
    </Animated.View>
  ) : (
    <CardContent />
  );
};

const styles = StyleSheet.create({
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    opacity: 0.5,
  },
});

export default Card;
