import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';

import LinearGradient from 'react-native-linear-gradient';
import Button from '../../components/SimpleButton';
import { useWallet } from '../../context/WalletContext';
import { useTheme } from '../../context/ThemeContext';
import ApplicationLifecycleManager from '../../services/ApplicationLifecycleManager';

const { width, height } = Dimensions.get('window');

type RootStackParamList = {
  Onboarding: undefined;
  Authentication: undefined;
  CreateWallet: undefined;
  ImportWallet: undefined;
  Home: undefined;
};

type Screen = 'Onboarding' | 'CreateWallet' | 'ImportWallet' | 'Home';

interface OnboardingScreenProps {
  onNavigate?: (screen: Screen) => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onNavigate }) => {
  const { colors, spacing, fontSize, fontWeight } = useTheme();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const styles = createStyles(colors);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setIsInitializing(true);
      
      // Initialize application lifecycle manager (simplified for now)
      console.log('Initializing app...');
      
      // For now, just set to not initializing after a delay
      setTimeout(() => {
        setIsInitializing(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to initialize app:', error);
      setIsInitializing(false);
    }
  };

  if (isInitializing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textPrimary }]}>
            Initializing...
          </Text>
        </View>
      </SafeAreaView>
    );
  }  const onboardingSlides = [
    {
      title: 'Welcome to Cypher',
      subtitle: 'Your professional crypto wallet',
      description: 'Experience the next generation of cryptocurrency management with enterprise-grade security and intuitive design.',
      icon: '⚡',
    },
    {
      title: 'Secure & Private',
      subtitle: 'Your keys, your crypto',
      description: 'Your private keys are encrypted and stored securely on your device. We never have access to your funds.',
      icon: '🔐',
    },
    {
      title: 'Multi-Chain Support',
      subtitle: 'Access multiple networks',
      description: 'Trade and manage assets across Ethereum, Polygon, and other supported networks.',
      icon: '🌐',
    },
  ];

  const currentSlideData = onboardingSlides[currentSlide];

  const handleNext = () => {
    if (currentSlide < onboardingSlides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleCreateWallet = () => {
    if (onNavigate) {
      onNavigate('CreateWallet');
    }
  };

  const handleImportWallet = () => {
    if (onNavigate) {
      onNavigate('ImportWallet');
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      
      <LinearGradient
        colors={[colors.primary, colors.primaryLight]}
        style={styles.gradientContainer}
      >
        {/* Progress Indicators */}
        <View style={styles.progressContainer}>
          {onboardingSlides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index === currentSlide && styles.progressDotActive,
              ]}
            />
          ))}
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          <Text style={styles.icon}>{currentSlideData.icon}</Text>
          <Text style={styles.title}>{currentSlideData.title}</Text>
          <Text style={styles.subtitle}>{currentSlideData.subtitle}</Text>
          <Text style={styles.description}>{currentSlideData.description}</Text>
        </View>

        {/* Navigation */}
        <View style={styles.navigationContainer}>
          {currentSlide < onboardingSlides.length - 1 ? (
            <View style={styles.slideNavigation}>
              {currentSlide > 0 && (
                <Button
                  title="Previous"
                  variant="outline"
                  onPress={handlePrevious}
                  style={styles.navButton}
                />
              )}
              <Button
                title="Next"
                variant="secondary"
                onPress={handleNext}
                style={styles.navButton}
              />
            </View>
          ) : (
            <View style={styles.actionContainer}>
              <Button
                title="Create New Wallet"
                variant="secondary"
                onPress={handleCreateWallet}
                fullWidth
              />
              <Button
                title="Import Existing Wallet"
                variant="outline"
                onPress={handleImportWallet}
                fullWidth
                style={styles.actionButton}
              />
            </View>
          )}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  gradientContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  progressDotActive: {
    backgroundColor: colors.textPrimary,
    width: 24,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  icon: {
    fontSize: 80,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  navigationContainer: {
    paddingBottom: 20,
  },
  slideNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    minWidth: 100,
  },
  actionContainer: {
    gap: 16,
  },
  actionButton: {
    marginBottom: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
  },
});

export default OnboardingScreen;
