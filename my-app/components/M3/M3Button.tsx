import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, ActivityIndicator, TextStyle } from 'react-native';
import Colors, { EmeraldTokens } from '@/constants/Colors';
import { DesignTokens } from '@/constants/DesignTokens';
import { useColorScheme } from '@/components/useColorScheme';

export interface M3ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'filled' | 'mint' | 'tonal' | 'outlined' | 'text';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'radio' | 'tab';
}

export const M3Button: React.FC<M3ButtonProps> = ({
  label,
  onPress,
  variant = 'mint',
  size = 'lg',
  icon,
  isLoading = false,
  disabled = false,
  style,
  labelStyle,
  accessibilityLabel,
  accessibilityRole = 'button',
}) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];

  const height = DesignTokens.buttonHeights[size];

  const getBackgroundColor = (pressed: boolean) => {
    if (disabled) return theme.surfaceVariant;
    if (variant === 'mint') return pressed ? EmeraldTokens.mintHover : EmeraldTokens.mintCta;
    if (variant === 'filled') return pressed ? theme.primaryDark : theme.primary;
    if (variant === 'tonal') return pressed ? theme.secondaryContainer : theme.secondaryContainer;
    if (variant === 'outlined' || variant === 'text') return pressed ? theme.primaryContainer : 'transparent';
    return EmeraldTokens.mintCta;
  };

  const getTextColor = () => {
    if (disabled) return theme.tabIconDefault;
    if (variant === 'mint') return EmeraldTokens.mintDarkText;
    if (variant === 'filled') return '#FFFFFF';
    if (variant === 'tonal') return theme.text;
    if (variant === 'outlined' || variant === 'text') return theme.primary;
    return EmeraldTokens.mintDarkText;
  };

  const getBorderStyle = () => {
    if (variant === 'outlined') {
      return {
        borderWidth: 1,
        borderColor: theme.outline,
      };
    }
    return {};
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || isLoading}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ disabled: disabled || isLoading }}
      style={({ pressed }) => [
        styles.buttonBase,
        {
          height,
          backgroundColor: getBackgroundColor(pressed),
          borderRadius: DesignTokens.shapes.pill,
          transform: [{ scale: pressed ? 0.98 : 1.0 }],
        },
        getBorderStyle(),
        variant === 'mint' && !disabled ? DesignTokens.shadows.floatingCta : {},
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.buttonText,
              {
                color: getTextColor(),
                fontSize: size === 'sm' ? 12 : size === 'md' ? 14 : 14,
                letterSpacing: 0.6,
                fontWeight: '700',
              },
              icon ? { marginLeft: 8 } : {},
              labelStyle,
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  buttonBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  buttonText: {
    textAlign: 'center',
  },
});
