import { Keyboard, Platform } from 'react-native';

/**
 * Keyboard Management Utility
 * Provides utilities to manage keyboard behavior and prevent common issues
 */
class KeyboardManager {
  private static instance: KeyboardManager;
  private keyboardListeners: any[] = [];

  static getInstance(): KeyboardManager {
    if (!KeyboardManager.instance) {
      KeyboardManager.instance = new KeyboardManager();
    }
    return KeyboardManager.instance;
  }

  /**
   * Prevents keyboard from dismissing unexpectedly
   */
  preventKeyboardDismiss = () => {
    if (Platform.OS === 'ios') {
      // On iOS, we can use this to maintain keyboard state
      return {
        blurOnSubmit: false,
        enablesReturnKeyAutomatically: false,
        returnKeyType: 'default' as const,
        keyboardType: 'default' as const,
      };
    } else {
      // On Android
      return {
        blurOnSubmit: false,
        enablesReturnKeyAutomatically: false,
        returnKeyType: 'default' as const,
        keyboardType: 'default' as const,
        underlineColorAndroid: 'transparent',
      };
    }
  };

  /**
   * Optimized props for multiline TextInputs
   */
  getMultilineProps = (numberOfLines: number = 4) => ({
    multiline: true,
    numberOfLines,
    textAlignVertical: 'top' as const,
    ...this.preventKeyboardDismiss(),
  });

  /**
   * Optimized props for single line TextInputs
   */
  getSingleLineProps = () => ({
    multiline: false,
    textAlignVertical: 'center' as const,
    ...this.preventKeyboardDismiss(),
  });

  /**
   * Force keyboard to stay open
   */
  keepKeyboardOpen = (textInputRef: any) => {
    if (textInputRef && textInputRef.current) {
      setTimeout(() => {
        textInputRef.current.focus();
      }, 50);
    }
  };

  /**
   * Dismiss keyboard programmatically
   */
  dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  /**
   * Add keyboard listeners
   */
  addKeyboardListeners = (onShow?: () => void, onHide?: () => void) => {
    if (onShow) {
      const showListener = Keyboard.addListener('keyboardDidShow', onShow);
      this.keyboardListeners.push(showListener);
    }
    
    if (onHide) {
      const hideListener = Keyboard.addListener('keyboardDidHide', onHide);
      this.keyboardListeners.push(hideListener);
    }
  };

  /**
   * Remove all keyboard listeners
   */
  removeKeyboardListeners = () => {
    this.keyboardListeners.forEach(listener => {
      if (listener && listener.remove) {
        listener.remove();
      }
    });
    this.keyboardListeners = [];
  };

  /**
   * Get platform-specific keyboard avoiding view behavior
   */
  getKeyboardAvoidingBehavior = () => {
    return Platform.OS === 'ios' ? 'padding' : 'height';
  };
}

export default KeyboardManager;
