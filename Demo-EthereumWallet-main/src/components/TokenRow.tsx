import React, { useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import HapticFeedback from 'react-native-haptic-feedback';
import { Token } from '../types';
import { colors, gradients, shadows, typography, spacing, borderRadius, layout, timing } from '../theme';

const { width } = Dimensions.get('window');

interface TokenRowProps {
  token: Token;
  onPress?: () => void;
  showBalance?: boolean;
  showPrice?: boolean;
  showChange?: boolean;
  animated?: boolean;
  index?: number;
}

const formatBalance = (balance: string, decimals: number = 18): string => {
  try {
    const balanceNum = parseFloat(balance) / Math.pow(10, decimals);
    if (balanceNum === 0) return '0';
    if (balanceNum < 0.001) return '< 0.001';
    if (balanceNum < 1) return balanceNum.toFixed(6);
    if (balanceNum < 1000) return balanceNum.toFixed(4);
    return balanceNum.toFixed(2);
  } catch {
    return '0';
  }
};

const formatPrice = (price: number): string => {
  if (price < 0.01) return `$${price.toFixed(6)}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(2)}`;
};

const formatValue = (balance: string, price: number, decimals: number = 18): string => {
  try {
    const balanceNum = parseFloat(balance) / Math.pow(10, decimals);
    const value = balanceNum * price;
    if (value < 0.01) return '$0.00';
    return `$${value.toFixed(2)}`;
  } catch {
    return '$0.00';
  }
};

const formatChange = (change: number): string => {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
};

const TokenRow: React.FC<TokenRowProps> = ({
  token,
  onPress,
  showBalance = true,
  showPrice = true,
  showChange = true,
  animated = true,
  index = 0,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;
  const glowValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.sequence([
        Animated.delay(index * 50),
        Animated.spring(animatedValue, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
      ]).start();
    } else {
      animatedValue.setValue(1);
    }
  }, [animated, index]);

  const handlePressIn = () => {
    if (Platform.OS === 'ios') {
      HapticFeedback.trigger('impactLight');
    }
    
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 0.96,
        useNativeDriver: true,
        tension: 150,
        friction: 8,
      }),
      Animated.timing(glowValue, {
        toValue: 1,
        duration: timing.fast,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
        tension: 150,
        friction: 8,
      }),
      Animated.timing(glowValue, {
        toValue: 0,
        duration: timing.normal,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const hasBalance = token.balance && parseFloat(token.balance) > 0;
  const hasPrice = token.price && token.price > 0;
  const hasChange = token.change24h !== undefined;
  const isPositiveChange = token.change24h && token.change24h >= 0;

  const renderTokenIcon = () => {
    const iconStyle = {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: spacing.sm,
    };

    if (token.logoURI) {
      return (
        <Animated.Image
          source={{ uri: token.logoURI }}
          style={[
            iconStyle,
            {
              borderWidth: 1,
              borderColor: colors.surfaceBorder,
            },
          ]}
          resizeMode="cover"
        />
      );
    }
    
    return (
      <Animated.View
        style={[
          iconStyle,
          {
            backgroundColor: colors.glass.dark,
            borderWidth: 1,
            borderColor: colors.surfaceBorder,
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}
      >
        <Text
          style={[
            typography.bodyMedium,
            {
              color: colors.primary,
              fontWeight: '600',
            },
          ]}
        >
          {token.symbol.charAt(0)}
        </Text>
      </Animated.View>
    );
  };

  const staticContainerStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: spacing.md,
    marginVertical: spacing.xs,
    marginHorizontal: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    ...shadows.glow,
  };

  const animatedContainerStyle = {
    borderColor: glowValue.interpolate({
      inputRange: [0, 1],
      outputRange: [colors.surfaceBorder, colors.primary + '80'],
    }),
  };

  const wrapperAnimatedStyle = {
    transform: [
      {
        scale: scaleValue,
      },
      {
        translateY: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [50, 0],
        }),
      },
    ],
    opacity: animatedValue,
  };

  return (
    <Animated.View style={wrapperAnimatedStyle}>
      <Animated.View style={[staticContainerStyle, animatedContainerStyle]}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={!onPress}
          activeOpacity={0.9}
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
        >
          {renderTokenIcon()}
          
          <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  typography.bodyLarge,
                  {
                    color: colors.textPrimary,
                    fontWeight: '600',
                    marginBottom: 2,
                  },
                ]}
              >
                {token.symbol}
              </Text>
              <Text
                style={[
                  typography.bodySmall,
                  {
                    color: colors.textSecondary,
                  },
                ]}
                numberOfLines={1}
              >
                {token.name}
              </Text>
              {showPrice && hasPrice && (
                <Text
                  style={[
                    typography.bodySmall,
                    {
                      color: colors.textSecondary,
                      marginTop: 2,
                    },
                  ]}
                >
                  {formatPrice(token.price!)}
                </Text>
              )}
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              {showBalance && hasBalance && (
                <>
                  <Text
                    style={[
                      typography.number,
                      {
                        color: colors.textPrimary,
                        fontWeight: '600',
                        textAlign: 'right',
                      },
                    ]}
                  >
                    {formatBalance(token.balance!, token.decimals)}
                  </Text>
                  {hasPrice && (
                    <Text
                      style={[
                        typography.bodySmall,
                        {
                          color: colors.textSecondary,
                          textAlign: 'right',
                        },
                      ]}
                    >
                      {formatValue(token.balance!, token.price!, token.decimals)}
                    </Text>
                  )}
                </>
              )}

              {showChange && hasChange && (
                <Text
                  style={[
                    typography.bodySmall,
                    {
                      color: isPositiveChange ? colors.success : colors.error,
                      fontWeight: '500',
                      textAlign: 'right',
                      marginTop: 2,
                    },
                  ]}
                >
                  {formatChange(token.change24h!)}
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

export default TokenRow;
export { TokenRow };
