import React, { useRef, useImperativeHandle, forwardRef, useState, useEffect } from 'react';
import {
  TextInput,
  TextInputProps,
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Keyboard,
  Platform,
} from 'react-native';
// Clipboard functionality removed - use @react-native-clipboard/clipboard package
const Clipboard = {
  getString: async () => '',
  setString: async (content: string) => console.log('Clipboard:', content)
};
import KeyboardManager from '../utils/keyboardManager';

interface OptimizedTextInputProps extends Omit<TextInputProps, 'onChangeText'> {
  value: string;
  onChangeText: (text: string) => void;
  showPasteButton?: boolean;
  pasteButtonText?: string;
  onPaste?: () => void;
  containerStyle?: any;
  inputStyle?: any;
  pasteButtonStyle?: any;
  label?: string;
  labelStyle?: any;
  hint?: string;
  hintStyle?: any;
  multiline?: boolean;
  numberOfLines?: number;
}

export interface OptimizedTextInputRef {
  focus: () => void;
  blur: () => void;
  clear: () => void;
  isFocused: () => boolean;
}

const OptimizedTextInput = forwardRef<OptimizedTextInputRef, OptimizedTextInputProps>(
  (
    {
      value,
      onChangeText,
      showPasteButton = false,
      pasteButtonText = "📋 Paste",
      onPaste,
      containerStyle,
      inputStyle,
      pasteButtonStyle,
      label,
      labelStyle,
      hint,
      hintStyle,
      multiline = false,
      numberOfLines = 1,
      ...textInputProps
    },
    ref
  ) => {
    const textInputRef = useRef<TextInput>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [internalValue, setInternalValue] = useState(value);
    const keyboardManager = KeyboardManager.getInstance();

    // Sync internal value with external value
    useEffect(() => {
      if (value !== internalValue) {
        setInternalValue(value);
      }
    }, [value]);

    // Setup keyboard listeners for better management
    useEffect(() => {
      keyboardManager.addKeyboardListeners(
        () => {
          // Keyboard shown - ensure our input stays focused if it was focused
          if (isFocused && textInputRef.current) {
            keyboardManager.keepKeyboardOpen(textInputRef);
          }
        },
        () => {
          // Keyboard hidden - update focus state
          setIsFocused(false);
        }
      );

      return () => {
        keyboardManager.removeKeyboardListeners();
      };
    }, [isFocused]);

    useImperativeHandle(ref, () => ({
      focus: () => {
        textInputRef.current?.focus();
      },
      blur: () => {
        textInputRef.current?.blur();
      },
      clear: () => {
        handleTextChange('');
      },
      isFocused: () => isFocused,
    }));

  const handleTextChange = (text: string) => {
    // Prevent unnecessary re-renders by only updating if text actually changed
    if (text !== internalValue) {
      setInternalValue(text);
      // Use setTimeout to prevent keyboard dismissal during text changes
      setTimeout(() => {
        onChangeText(text);
        // Keep focus on the input to prevent keyboard from closing
        if (textInputRef.current && isFocused) {
          textInputRef.current.focus();
        }
      }, 10);
    }
  };    const handlePaste = async () => {
      try {
        const clipboardText = await Clipboard.getString();
        if (clipboardText && clipboardText.trim()) {
          const trimmedText = clipboardText.trim();
          
          // Update the text first
          handleTextChange(trimmedText);
          
          // Ensure the input stays focused and keyboard remains open
          setTimeout(() => {
            if (textInputRef.current) {
              textInputRef.current.focus();
              setIsFocused(true);
            }
          }, 50);
          
          // Keep keyboard open for multiline inputs
          if (multiline) {
            keyboardManager.keepKeyboardOpen(textInputRef);
          }
          
          if (onPaste) {
            onPaste();
          }
          
          console.log('✅ Text pasted successfully:', trimmedText.substring(0, 30) + (trimmedText.length > 30 ? '...' : ''));
        } else {
          console.log('⚠️ Clipboard is empty or contains only whitespace');
        }
      } catch (error) {
        console.error('❌ Failed to paste from clipboard:', error);
      }
    };

    const handleFocus = () => {
      setIsFocused(true);
      console.log('🎯 TextInput focused');
      if (textInputProps.onFocus) {
        textInputProps.onFocus({} as any);
      }
    };

    const handleBlur = () => {
      // Prevent accidental blur during text input
      setTimeout(() => {
        setIsFocused(false);
        console.log('👋 TextInput blurred');
        if (textInputProps.onBlur) {
          textInputProps.onBlur({} as any);
        }
      }, 100);
    };

    return (
      <View style={[styles.container, containerStyle]}>
        {label && (
          <View style={styles.labelContainer}>
            <Text style={[styles.label, labelStyle]}>{label}</Text>
            {showPasteButton && (
              <TouchableOpacity
                onPress={handlePaste}
                style={[styles.pasteButton, pasteButtonStyle]}
                activeOpacity={0.7}
              >
                <Text style={styles.pasteButtonText}>{pasteButtonText}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        
        <TextInput
          ref={textInputRef}
          value={internalValue}
          onChangeText={handleTextChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[
            styles.textInput,
            multiline && styles.textInputMultiline,
            isFocused && styles.textInputFocused,
            inputStyle,
          ]}
          {...(multiline 
            ? keyboardManager.getMultilineProps(numberOfLines)
            : keyboardManager.getSingleLineProps()
          )}
          autoComplete="off"
          spellCheck={false}
          contextMenuHidden={false}
          selection={undefined}
          {...textInputProps}
        />
        
        {hint && (
          <Text style={[styles.hint, hintStyle]}>{hint}</Text>
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  pasteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(34, 197, 94, 0.8)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  pasteButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'rgba(15, 15, 15, 0.6)',
    color: '#ffffff',
    minHeight: 48,
  },
  textInputMultiline: {
    minHeight: 100,
    paddingTop: 12,
  },
  textInputFocused: {
    borderColor: '#22c55e',
    borderWidth: 2,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  hint: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
});

OptimizedTextInput.displayName = 'OptimizedTextInput';

export default OptimizedTextInput;
