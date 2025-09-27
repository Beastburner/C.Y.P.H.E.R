import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { ModernColors, ModernSpacing, ModernBorderRadius, ModernShadows } from '../styles/ModernTheme';

interface ModernCardProps {
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
  variant?: 'default' | 'gradient' | 'glass' | 'privacy';
  padding?: 'none' | 'small' | 'medium' | 'large';
  margin?: 'none' | 'small' | 'medium' | 'large';
  style?: ViewStyle;
  headerStyle?: ViewStyle;
  contentStyle?: ViewStyle;
  showBorder?: boolean;
  elevation?: 'none' | 'small' | 'medium' | 'large';
}

const ModernCard: React.FC<ModernCardProps> = ({
  children,
  title,
  subtitle,
  headerRight,
  variant = 'default',
  padding = 'medium',
  margin = 'medium',
  style,
  headerStyle,
  contentStyle,
  showBorder = false,
  elevation = 'medium',
}) => {
  const getCardStyle = () => {
    const baseStyle: ViewStyle[] = [
      styles.card,
      styles[`padding_${padding}`],
      styles[`margin_${margin}`],
      showBorder && styles.border,
      elevation !== 'none' && styles[`elevation_${elevation}`],
    ].filter(Boolean) as ViewStyle[];
    
    return [...baseStyle, style].filter(Boolean) as ViewStyle[];
  };

  const CardContent = () => (
    <View style={[styles.container, contentStyle]}>
      {(title || subtitle || headerRight) && (
        <View style={[styles.header, headerStyle]}>
          <View style={styles.headerLeft}>
            {title && <Text style={styles.title}>{title}</Text>}
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          {headerRight && <View style={styles.headerRight}>{headerRight}</View>}
        </View>
      )}
      {children && <View style={styles.content}>{children}</View>}
    </View>
  );

  switch (variant) {
    case 'gradient':
      return (
        <LinearGradient
          colors={ModernColors.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={getCardStyle()}
        >
          <CardContent />
        </LinearGradient>
      );

    case 'glass':
      return (
        <View style={[getCardStyle(), styles.glassCard]}>
          <CardContent />
        </View>
      );

    case 'privacy':
      return (
        <View style={getCardStyle()}>
          <LinearGradient
            colors={['rgba(139, 92, 246, 0.1)', 'rgba(139, 92, 246, 0.05)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.privacyOverlay}
          />
          <CardContent />
        </View>
      );

    default:
      return (
        <View style={getCardStyle()}>
          <CardContent />
        </View>
      );
  }
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: ModernColors.surface,
    borderRadius: ModernBorderRadius.xl,
    overflow: 'hidden',
  },
  
  container: {
    flex: 1,
  },
  
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  
  privacyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: ModernBorderRadius.xl,
  },
  
  border: {
    borderWidth: 1,
    borderColor: ModernColors.border,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ModernSpacing.md,
  },
  
  headerLeft: {
    flex: 1,
  },
  
  headerRight: {
    marginLeft: ModernSpacing.md,
  },
  
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: ModernColors.textPrimary,
    marginBottom: 2,
  },
  
  subtitle: {
    fontSize: 14,
    color: ModernColors.textSecondary,
  },
  
  content: {
    flex: 1,
  },
  
  // Padding variants
  padding_none: {
    padding: 0,
  },
  
  padding_small: {
    padding: ModernSpacing.md,
  },
  
  padding_medium: {
    padding: ModernSpacing.xl,
  },
  
  padding_large: {
    padding: ModernSpacing.xxl,
  },
  
  // Margin variants
  margin_none: {
    margin: 0,
  },
  
  margin_small: {
    marginHorizontal: ModernSpacing.md,
    marginVertical: ModernSpacing.sm,
  },
  
  margin_medium: {
    marginHorizontal: ModernSpacing.lg,
    marginVertical: ModernSpacing.sm,
  },
  
  margin_large: {
    marginHorizontal: ModernSpacing.xl,
    marginVertical: ModernSpacing.md,
  },
  
  // Elevation variants
  elevation_small: {
    ...ModernShadows.small,
  },
  
  elevation_medium: {
    ...ModernShadows.medium,
  },
  
  elevation_large: {
    ...ModernShadows.large,
  },
});

export default ModernCard;
