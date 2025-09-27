import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

interface StartupAnimationProps {
  onComplete?: () => void;
}

const SimpleStartupAnimation: React.FC<StartupAnimationProps> = ({ onComplete }) => {
  const { colors, spacing, fontSize, fontWeight } = useTheme();
  
  // Simple fade animations
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animations
    const logoAnimation = Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]);

    const textAnimation = Animated.timing(textOpacity, {
      toValue: 1,
      duration: 800,
      delay: 500,
      useNativeDriver: true,
    });

    Animated.sequence([logoAnimation, textAnimation]).start(() => {
      // Animation complete, call onComplete after a short delay
      setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, 1000);
    });
  }, [logoOpacity, logoScale, textOpacity, onComplete]);

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: spacing.xl,
    },
    logo: {
      width: 120,
      height: 120,
      backgroundColor: colors.primary,
      borderRadius: 60,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 10,
    },
    logoText: {
      fontSize: 36,
      fontWeight: fontWeight.bold,
      color: colors.textPrimary,
    },
    appName: {
      fontSize: fontSize.xxxl,
      fontWeight: fontWeight.bold,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    tagline: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.medium,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: spacing.xl,
    },
  });

  return (
    <View style={dynamicStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      <Animated.View 
        style={[
          dynamicStyles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <View style={dynamicStyles.logo}>
          <Text style={dynamicStyles.logoText}>E</Text>
        </View>
      </Animated.View>

      <Animated.View style={{ opacity: textOpacity }}>
        <Text style={dynamicStyles.appName}>Cypher Wallet</Text>
        <Text style={dynamicStyles.tagline}>
          Your Gateway to DeFi Revolution
        </Text>
      </Animated.View>
    </View>
  );
};

export default SimpleStartupAnimation;
