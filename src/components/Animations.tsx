import React, { useEffect, useRef } from 'react';
import { View, ViewStyle, Animated } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface AnimatedContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  animation?: 'fadeIn' | 'slideInLeft' | 'slideInRight' | 'slideInUp' | 'slideInDown' | 'zoomIn' | 'rotateIn';
  duration?: number;
  delay?: number;
}

export const AnimatedContainer: React.FC<AnimatedContainerProps> = ({
  children,
  style,
  animation = 'fadeIn',
  duration = 300,
  delay = 0,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(animation === 'slideInLeft' ? -50 : animation === 'slideInRight' ? 50 : 0)).current;
  const translateY = useRef(new Animated.Value(animation === 'slideInUp' ? -50 : animation === 'slideInDown' ? 50 : 0)).current;
  const scale = useRef(new Animated.Value(animation === 'zoomIn' ? 0.5 : 1)).current;

  useEffect(() => {
    const startAnimation = () => {
      const animations = [
        Animated.timing(opacity, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
      ];

      const shouldAnimateX = animation === 'slideInLeft' || animation === 'slideInRight';
      const shouldAnimateY = animation === 'slideInUp' || animation === 'slideInDown';
      const shouldAnimateScale = animation === 'zoomIn';

      if (shouldAnimateX) {
        animations.push(
          Animated.timing(translateX, {
            toValue: 0,
            duration,
            useNativeDriver: true,
          })
        );
      }

      if (shouldAnimateY) {
        animations.push(
          Animated.timing(translateY, {
            toValue: 0,
            duration,
            useNativeDriver: true,
          })
        );
      }

      if (shouldAnimateScale) {
        animations.push(
          Animated.timing(scale, {
            toValue: 1,
            duration,
            useNativeDriver: true,
          })
        );
      }

      Animated.parallel(animations).start();
    };

    const timer = setTimeout(startAnimation, delay);
    return () => clearTimeout(timer);
  }, [opacity, translateX, translateY, scale, duration, delay, animation]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: [
            { translateX },
            { translateY },
            { scale },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

interface PulseAnimationProps {
  children: React.ReactNode;
  style?: ViewStyle;
  duration?: number;
  intensity?: number;
}

export const PulseAnimation: React.FC<PulseAnimationProps> = ({
  children,
  style,
  duration = 1000,
  intensity = 0.1,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    const createPulse = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1 + intensity,
            duration: duration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: duration / 2,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    createPulse();
  }, [duration, intensity]);

  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      {children}
    </Animated.View>
  );
};

interface ScaleAnimationProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  scaleTo?: number;
  duration?: number;
}

export const ScaleAnimation: React.FC<ScaleAnimationProps> = ({
  children,
  style,
  onPress,
  scaleTo = 0.95,
  duration = 100,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: scaleTo,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[style, { transform: [{ scale }] }]}
      onTouchStart={handlePressIn}
      onTouchEnd={handlePressOut}
      onTouchCancel={handlePressOut}
    >
      {children}
    </Animated.View>
  );
};

interface ShakeAnimationProps {
  children: React.ReactNode;
  style?: ViewStyle;
  trigger?: boolean;
  intensity?: number;
  duration?: number;
}

export const ShakeAnimation: React.FC<ShakeAnimationProps> = ({
  children,
  style,
  trigger = false,
  intensity = 10,
  duration = 500,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (trigger) {
      const shakeAnimation = Animated.sequence([
        Animated.timing(translateX, { toValue: intensity, duration: duration / 8, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: -intensity, duration: duration / 8, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: intensity, duration: duration / 8, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: -intensity, duration: duration / 8, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: intensity, duration: duration / 8, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: -intensity, duration: duration / 8, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: intensity, duration: duration / 8, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: 0, duration: duration / 8, useNativeDriver: true }),
      ]);
      
      shakeAnimation.start();
    }
  }, [trigger, intensity, duration]);

  return (
    <Animated.View style={[style, { transform: [{ translateX }] }]}>
      {children}
    </Animated.View>
  );
};

interface FadeAnimationProps {
  children: React.ReactNode;
  style?: ViewStyle;
  visible?: boolean;
  duration?: number;
}

export const FadeAnimation: React.FC<FadeAnimationProps> = ({
  children,
  style,
  visible = true,
  duration = 300,
}) => {
  const opacity = useRef(new Animated.Value(visible ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration,
      useNativeDriver: true,
    }).start();
  }, [visible, duration]);

  return (
    <Animated.View style={[style, { opacity }]}>
      {children}
    </Animated.View>
  );
};

interface RotationAnimationProps {
  children: React.ReactNode;
  style?: ViewStyle;
  rotating?: boolean;
  duration?: number;
}

export const RotationAnimation: React.FC<RotationAnimationProps> = ({
  children,
  style,
  rotating = false,
  duration = 1000,
}) => {
  const rotation = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (rotating) {
      Animated.loop(
        Animated.timing(rotation, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        })
      ).start();
    } else {
      Animated.timing(rotation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [rotating, duration]);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[style, { transform: [{ rotate: spin }] }]}>
      {children}
    </Animated.View>
  );
};

interface SlideAnimationProps {
  children: React.ReactNode;
  style?: ViewStyle;
  slideIn?: boolean;
  direction?: 'left' | 'right' | 'up' | 'down';
  distance?: number;
  duration?: number;
}

export const SlideAnimation: React.FC<SlideAnimationProps> = ({
  children,
  style,
  slideIn = true,
  direction = 'left',
  distance = 100,
  duration = 300,
}) => {
  const translateX = useRef(new Animated.Value(direction === 'left' ? -distance : direction === 'right' ? distance : 0)).current;
  const translateY = useRef(new Animated.Value(direction === 'up' ? -distance : direction === 'down' ? distance : 0)).current;

  React.useEffect(() => {
    if (slideIn) {
      Animated.parallel([
        Animated.timing(translateX, { toValue: 0, duration, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: direction === 'left' ? -distance : direction === 'right' ? distance : 0,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: direction === 'up' ? -distance : direction === 'down' ? distance : 0,
          duration,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [slideIn, direction, distance, duration]);

  return (
    <Animated.View style={[style, { transform: [{ translateX }, { translateY }] }]}>
      {children}
    </Animated.View>
  );
};

// Loading animation component
interface LoadingAnimationProps {
  size?: number;
  color?: string;
}

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ size = 40, color }) => {
  const { colors } = useTheme();
  const rotation = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 3,
          borderColor: color || colors.primary,
          borderTopColor: 'transparent',
          transform: [{ rotate: spin }],
        },
      ]}
    />
  );
};

export default {
  AnimatedContainer,
  PulseAnimation,
  ScaleAnimation,
  ShakeAnimation,
  FadeAnimation,
  RotationAnimation,
  SlideAnimation,
  LoadingAnimation,
};
