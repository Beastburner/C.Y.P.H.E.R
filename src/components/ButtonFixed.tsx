import React from 'react';
import { TouchableOpacityProps, ActivityIndicator } from 'react-native';
import styled from 'styled-components/native';
// Removed HapticFeedback import to fix crash

// Button variants
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends TouchableOpacityProps {
  title?: string; // Add title prop for backward compatibility
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

const getButtonHeight = (size: ButtonSize) => {
  switch (size) {
    case 'small': return '36px';
    case 'large': return '56px';
    default: return '48px';
  }
};

const getButtonPadding = (size: ButtonSize) => {
  switch (size) {
    case 'small': return '8px 12px';
    case 'large': return '16px 24px';
    default: return '12px 16px';
  }
};

const getFontSize = (size: ButtonSize) => {
  switch (size) {
    case 'small': return '14px';
    case 'large': return '18px';
    default: return '16px';
  }
};

const StyledButton = styled.TouchableOpacity<{
  variant: ButtonVariant;
  size: ButtonSize;
  fullWidth?: boolean;
  disabled?: boolean;
}>`
  height: ${props => getButtonHeight(props.size)};
  padding: ${props => getButtonPadding(props.size)};
  border-radius: 12px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  width: ${props => props.fullWidth ? '100%' : 'auto'};
  opacity: ${props => props.disabled ? 0.5 : 1};
  
  ${({ variant, theme }) => {
    switch (variant) {
      case 'primary':
        return `
          background-color: #4F46E5;
          shadow-color: #000;
          shadow-offset: 0px 4px;
          shadow-opacity: 0.12;
          shadow-radius: 8px;
          elevation: 4;
        `;
      case 'secondary':
        return `
          background-color: #E5E7EB;
        `;
      case 'outline':
        return `
          background-color: transparent;
          border: 1.5px solid #4F46E5;
        `;
      case 'ghost':
        return `
          background-color: transparent;
        `;
      case 'danger':
        return `
          background-color: #EF4444;
          shadow-color: #000;
          shadow-offset: 0px 4px;
          shadow-opacity: 0.12;
          shadow-radius: 8px;
          elevation: 4;
        `;
      default:
        return '';
    }
  }}
`;

const ButtonText = styled.Text<{
  variant: ButtonVariant;
  size: ButtonSize;
}>`
  font-size: ${props => getFontSize(props.size)};
  font-weight: 600;
  text-align: center;
  
  ${({ variant }) => {
    switch (variant) {
      case 'primary':
      case 'danger':
        return `color: #FFFFFF;`;
      case 'secondary':
        return `color: #1F2937;`;
      case 'outline':
      case 'ghost':
        return `color: #4F46E5;`;
      default:
        return `color: #1F2937;`;
    }
  }}
`;

const IconContainer = styled.View`
  margin-right: 8px;
`;

const ButtonFixed: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  icon,
  fullWidth = false,
  disabled = false,
  children,
  onPress,
  ...props
}) => {
  const handlePress = (event: any) => {
    if (!disabled && !loading) {
      // Removed haptic feedback to fix crash
      onPress?.(event);
    }
  };

  // Use title if provided, otherwise use children
  const buttonContent = title || children;

  return (
    <StyledButton
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      disabled={disabled || loading}
      onPress={handlePress}
      activeOpacity={0.8}
      {...(props as any)}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' || variant === 'danger' ? '#FFFFFF' : '#4F46E5'} 
        />
      ) : (
        <>
          {icon && <IconContainer>{icon}</IconContainer>}
          <ButtonText variant={variant} size={size}>
            {buttonContent}
          </ButtonText>
        </>
      )}
    </StyledButton>
  );
};

export default ButtonFixed;
export { ButtonFixed };
