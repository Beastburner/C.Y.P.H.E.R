/**
 * CYPHER LOGO COMPONENT - Brand Identity System
 * Consistent logo usage across the entire application
 * Professional branding for the next generation of Web3
 */

import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle, ImageStyle, TextStyle } from 'react-native';
import { ModernColors, ModernSpacing, ModernBorderRadius } from '../styles/ModernTheme';

interface CypherLogoProps {
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  variant?: 'logo-only' | 'logo-text' | 'text-only';
  color?: 'light' | 'dark' | 'auto';
  style?: ViewStyle;
  imageStyle?: ImageStyle;
  textStyle?: TextStyle;
}

/**
 * Cypher Logo Component
 * Displays the brand logo with consistent sizing and styling
 */
export const CypherLogo: React.FC<CypherLogoProps> = ({
  size = 'medium',
  variant = 'logo-text',
  color = 'auto',
  style,
  imageStyle,
  textStyle
}) => {
  // Size configurations
  const sizeConfig = {
    small: {
      logoSize: { width: 24, height: 24 },
      fontSize: 16,
      spacing: ModernSpacing.xs,
    },
    medium: {
      logoSize: { width: 32, height: 32 },
      fontSize: 18,
      spacing: ModernSpacing.sm,
    },
    large: {
      logoSize: { width: 48, height: 48 },
      fontSize: 24,
      spacing: ModernSpacing.md,
    },
    xlarge: {
      logoSize: { width: 64, height: 64 },
      fontSize: 32,
      spacing: ModernSpacing.lg,
    }
  };

  const config = sizeConfig[size];

  // Text color based on variant
  const getTextColor = () => {
    if (color === 'light') return ModernColors.textInverse;
    if (color === 'dark') return ModernColors.textPrimary;
    return ModernColors.textPrimary; // Auto defaults to dark
  };

  const renderLogo = () => {
    if (variant === 'text-only') return null;

    return (
      <Image
        source={require('../../assets/Cypher-logo.png')}
        style={[
          styles.logoImage,
          config.logoSize,
          imageStyle
        ]}
        resizeMode="contain"
      />
    );
  };

  const renderText = () => {
    if (variant === 'logo-only') return null;

    return (
      <Text
        style={[
          styles.logoText,
          {
            fontSize: config.fontSize,
            color: getTextColor(),
            marginLeft: variant === 'logo-text' ? config.spacing : 0,
          },
          textStyle
        ]}
      >
        CYPHER
      </Text>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {renderLogo()}
      {renderText()}
    </View>
  );
};

/**
 * Specialized Header Logo Component
 * Optimized for header usage with proper spacing
 */
export const CypherHeaderLogo: React.FC<{
  showText?: boolean;
  color?: 'light' | 'dark';
  style?: ViewStyle;
}> = ({ showText = true, color = 'light', style }) => (
  <CypherLogo
    size="medium"
    variant={showText ? 'logo-text' : 'logo-only'}
    color={color}
    style={style}
  />
);

/**
 * Branded Splash Logo Component
 * Large logo for splash screens and onboarding
 */
export const CypherSplashLogo: React.FC<{
  style?: ViewStyle;
}> = ({ style }) => (
  <View style={[styles.splashContainer, style]}>
    <CypherLogo
      size="xlarge"
      variant="logo-text"
      color="light"
      style={styles.splashLogo}
    />
    <Text style={styles.tagline}>Next Generation Web3 Wallet</Text>
  </View>
);

/**
 * Compact Logo for Tab Bars and Small Spaces
 */
export const CypherCompactLogo: React.FC<{
  style?: ViewStyle;
}> = ({ style }) => (
  <CypherLogo
    size="small"
    variant="logo-only"
    color="auto"
    style={style}
  />
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  logoImage: {
    // Base logo image styles
  },
  
  logoText: {
    fontWeight: '700',
    letterSpacing: 1,
  },
  
  headerContainer: {
    // Header specific styling can be added here
    flex: 0,
  },
  
  splashContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: ModernSpacing.xxxl,
  },
  
  splashLogo: {
    marginBottom: ModernSpacing.lg,
  },
  
  tagline: {
    fontSize: 14,
    color: ModernColors.textInverse,
    textAlign: 'center',
    opacity: 0.8,
    letterSpacing: 0.5,
  },
});

export default CypherLogo;
