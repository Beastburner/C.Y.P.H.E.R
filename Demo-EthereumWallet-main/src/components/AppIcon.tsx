import React from 'react';
import { TextStyle, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FeatherIcon from 'react-native-vector-icons/Feather';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';

interface AppIconProps {
  name: string;
  library?: 'material' | 'feather' | 'fontawesome5' | 'ionicons';
  size?: number;
  color?: string;
  style?: TextStyle;
}

export const AppIcon: React.FC<AppIconProps> = ({
  name,
  size = 24,
  color,
  style,
  library = 'material',
}) => {
  const { colors } = useTheme();
  const iconColor = color || colors.textPrimary;

  const getIconComponent = () => {
    switch (library) {
      case 'feather':
        return <FeatherIcon name={name} size={size} color={iconColor} style={style as any} />;
      case 'fontawesome5':
        return <FontAwesome5 name={name} size={size} color={iconColor} style={style as any} />;
      case 'ionicons':
        return <Ionicons name={name} size={size} color={iconColor} style={style as any} />;
      case 'material':
      default:
        return <Icon name={name} size={size} color={iconColor} style={style as any} />;
    }
  };

  return getIconComponent();
};

// Icon mapping for commonly used emojis
export const IconMap = {
  // Navigation & Actions
  refresh: { name: 'refresh', library: 'material' as const },
  swap: { name: 'swap-horiz', library: 'material' as const },
  send: { name: 'send', library: 'feather' as const },
  receive: { name: 'download', library: 'feather' as const },
  scan: { name: 'qr-code-scanner', library: 'material' as const },
  settings: { name: 'settings', library: 'feather' as const },
  back: { name: 'arrow-back', library: 'material' as const },
  close: { name: 'close', library: 'material' as const },
  menu: { name: 'menu', library: 'feather' as const },
  
  // Security & Authentication
  lock: { name: 'lock', library: 'feather' as const },
  unlock: { name: 'unlock', library: 'feather' as const },
  shield: { name: 'shield', library: 'feather' as const },
  key: { name: 'key', library: 'feather' as const },
  fingerprint: { name: 'fingerprint', library: 'material' as const },
  
  // Wallet & Finance
  wallet: { name: 'account-balance-wallet', library: 'material' as const },
  money: { name: 'attach-money', library: 'material' as const },
  diamond: { name: 'gem', library: 'fontawesome5' as const },
  coins: { name: 'coins', library: 'fontawesome5' as const },
  
  // Status & Alerts
  success: { name: 'check-circle', library: 'feather' as const },
  error: { name: 'x-circle', library: 'feather' as const },
  warning: { name: 'alert-triangle', library: 'feather' as const },
  info: { name: 'info', library: 'feather' as const },
  
  // Network & Connectivity
  wifi: { name: 'wifi', library: 'feather' as const },
  globe: { name: 'globe', library: 'feather' as const },
  link: { name: 'link', library: 'feather' as const },
  
  // UI Elements
  eye: { name: 'eye', library: 'feather' as const },
  eyeOff: { name: 'eye-off', library: 'feather' as const },
  copy: { name: 'copy', library: 'feather' as const },
  share: { name: 'share', library: 'feather' as const },
  download: { name: 'download', library: 'feather' as const },
  upload: { name: 'upload', library: 'feather' as const },
  
  // Categories
  home: { name: 'home', library: 'feather' as const },
  transactions: { name: 'list', library: 'feather' as const },
  tokens: { name: 'layers', library: 'feather' as const },
  nft: { name: 'image', library: 'feather' as const },
  defi: { name: 'trending-up', library: 'feather' as const },
  browser: { name: 'globe', library: 'feather' as const },
  
  // Time & Date
  clock: { name: 'clock', library: 'feather' as const },
  calendar: { name: 'calendar', library: 'feather' as const },
  
  // Misc
  star: { name: 'star', library: 'feather' as const },
  heart: { name: 'heart', library: 'feather' as const },
  bookmark: { name: 'bookmark', library: 'feather' as const },
  tag: { name: 'tag', library: 'feather' as const },
  
  // Charts & Analytics
  chartUp: { name: 'trending-up', library: 'feather' as const },
  chartDown: { name: 'trending-down', library: 'feather' as const },
  barChart: { name: 'bar-chart-2', library: 'feather' as const },
  pieChart: { name: 'pie-chart', library: 'feather' as const },
};

// Convenience component for predefined icons
interface QuickIconProps {
  icon: keyof typeof IconMap;
  size?: number;
  color?: string;
  style?: TextStyle | ViewStyle;
}

export const QuickIcon: React.FC<QuickIconProps> = ({ icon, size, color, style }) => {
  const iconConfig = IconMap[icon];
  return (
    <AppIcon
      name={iconConfig.name}
      library={iconConfig.library}
      size={size}
      color={color}
      style={style}
    />
  );
};

export default AppIcon;
