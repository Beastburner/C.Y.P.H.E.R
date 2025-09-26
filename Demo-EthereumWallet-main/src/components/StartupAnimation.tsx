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

const StartupAnimation: React.FC<StartupAnimationProps> = ({ onComplete }) => {
  const { colors, spacing } = useTheme();
  
  // Logo animations
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoRotation = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  
  // Text animations
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textScale = useRef(new Animated.Value(0.8)).current;
  
  // Particle effects
  const particleOpacity = useRef(new Animated.Value(0)).current;
  const sparkleOpacity = useRef(new Animated.Value(0)).current;
  
  // Progress bar
  const progressValue = useRef(new Animated.Value(0)).current;
  
  // Glow effect
  const glowOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startAnimation = () => {
      // Phase 1: Logo entrance (0-800ms)
      const logoAnimation = Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 3,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]);

      // Phase 2: Text reveal (600-1200ms)
      const textAnimation = Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 600,
          delay: 400,
          useNativeDriver: true,
        }),
        Animated.spring(textScale, {
          toValue: 1,
          delay: 400,
          useNativeDriver: true,
          tension: 80,
          friction: 4,
        }),
      ]);

      // Phase 3: Particle effects (800-1600ms)
      const particleAnimation = Animated.sequence([
        Animated.timing(particleOpacity, {
          toValue: 1,
          duration: 400,
          delay: 600,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]);

      // Phase 4: Progress bar (1000-2200ms)
      const progressAnimation = Animated.timing(progressValue, {
        toValue: 1,
        duration: 1200,
        delay: 800,
        useNativeDriver: false,
      });

      // Phase 5: Glow effect (1500-2500ms)
      const glowAnimation = Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 1,
          duration: 500,
          delay: 1300,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.7,
          duration: 500,
          useNativeDriver: true,
        }),
      ]);

      // Start all animations
      Animated.parallel([
        logoAnimation,
        textAnimation,
        particleAnimation,
        progressAnimation,
      ]).start(() => {
        glowAnimation.start();
        
        // Complete after total animation time
        setTimeout(() => {
          if (onComplete) {
            onComplete();
          }
        }, 2500);
      });
    };

    startAnimation();
  }, [
    logoScale,
    logoRotation,
    logoOpacity,
    textOpacity,
    textScale,
    particleOpacity,
    sparkleOpacity,
    progressValue,
    glowOpacity,
    onComplete,
  ]);

  const logoRotationInterpolate = logoRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth = progressValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width * 0.7],
  });

  // Generate particle positions
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 4 + 2,
    delay: Math.random() * 1000,
  }));

  const styles = createStyles(colors, spacing);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Background Gradient */}
      <View style={styles.backgroundGradient} />
      
      {/* Particles */}
      {particles.map((particle) => (
        <Animated.View
          key={particle.id}
          style={[
            styles.particle,
            {
              left: particle.x,
              top: particle.y,
              width: particle.size,
              height: particle.size,
              opacity: particleOpacity,
              transform: [
                {
                  scale: particleOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                  }),
                },
              ],
            },
          ]}
        />
      ))}

      {/* Sparkle Effects */}
      <Animated.View
        style={[
          styles.sparkleContainer,
          {
            opacity: sparkleOpacity,
          },
        ]}
      >
        {Array.from({ length: 8 }, (_, i) => (
          <View
            key={i}
            style={[
              styles.sparkle,
              {
                left: Math.random() * width,
                top: Math.random() * height,
                transform: [{ rotate: `${Math.random() * 360}deg` }],
              },
            ]}
          />
        ))}
      </Animated.View>

      {/* Central Content */}
      <View style={styles.centerContent}>
        {/* Glow Background */}
        <Animated.View
          style={[
            styles.glowBackground,
            {
              opacity: glowOpacity,
            },
          ]}
        />

        {/* Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [
                { scale: logoScale },
                { rotate: logoRotationInterpolate },
              ],
            },
          ]}
        >
          <View style={styles.logo}>
            <View style={styles.logoInner}>
              <Text style={styles.logoText}>E</Text>
            </View>
          </View>
        </Animated.View>

        {/* Brand Text */}
        <Animated.View
          style={[
            styles.brandContainer,
            {
              opacity: textOpacity,
              transform: [{ scale: textScale }],
            },
          ]}
        >
          <Text style={styles.brandText}>CYPHER</Text>
          <Text style={styles.brandSubtext}>WALLET</Text>
        </Animated.View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressWidth,
              },
            ]}
          />
        </View>
        <Text style={styles.loadingText}>Initializing Secure Wallet...</Text>
      </View>
    </View>
  );
};

const createStyles = (colors: any, spacing: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
  },
  particle: {
    position: 'absolute',
    backgroundColor: colors.primary,
    borderRadius: 50,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  sparkleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sparkle: {
    position: 'absolute',
    width: 6,
    height: 6,
    backgroundColor: colors.secondary,
    borderRadius: 3,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 8,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowBackground: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.surface,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
    elevation: 20,
  },
  logoContainer: {
    marginBottom: spacing.xl || 32,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 15,
  },
  logoInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 32,
    color: colors.background,
    fontWeight: '900',
    textAlign: 'center',
  },
  brandContainer: {
    alignItems: 'center',
  },
  brandText: {
    fontSize: 24,
    color: colors.textPrimary,
    fontWeight: '800',
    marginBottom: spacing.xs || 8,
    textShadowColor: colors.primary,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  brandSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 3,
    textAlign: 'center',
  },
  progressContainer: {
    position: 'absolute',
    bottom: height * 0.15,
    alignItems: 'center',
    width: '100%',
  },
  progressTrack: {
    width: width * 0.7,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginBottom: spacing.md || 16,
    overflow: 'hidden',
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.primary,
    borderRadius: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  loadingText: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});

export default StartupAnimation;
