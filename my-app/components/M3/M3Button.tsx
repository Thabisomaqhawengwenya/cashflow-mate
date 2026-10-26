import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import Colors from '@/constants/Colors';
import { DesignTokens } from '@/constants/DesignTokens';
import { useColorScheme } from '@/components/useColorScheme';

export interface M3ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'filled' | 'tonal' | 'outlined' | 'text';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'radio' | 'tab';
}

export const M3Button: React.FC<M3ButtonProps> = ({
  label,
  onPress,
  variant = 'filled',
  size = 'md',
  icon,
  isLoading = false,
  disabled = false,
  style,
  accessibilityLabel,
  accessibilityRole = 'button',
}) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];

  const height = DesignTokens.buttonHeights[size];

  const getBackgroundColor = (pressed: boolean) => {
    if (disabled) return theme.surfaceVariant;
    if (variant === 'filled') return pressed ? theme.tint : theme.primary;
    if (variant === 'tonal') return pressed ? theme.secondaryContainer : theme.secondaryContainer;
    if (variant === 'outlined' || variant === 'text') return pressed ? theme.primaryContainer : 'transparent';
    return theme.primary;
  };

  const getTextColor = () => {
    if (disabled) return theme.tabIconDefault;
    if (variant === 'filled') return '#FFFFFF';
    if (variant === 'tonal') return theme.text;
    if (variant === 'outlined' || variant === 'text') return theme.primary;
    return '#FFFFFF';
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
      hitSlop={size === 'sm' ? { top: 6, bottom: 6, left: 6, right: 6 } : undefined}
      style={({ pressed }) => [
        styles.base,
        {
          height,
          backgroundColor: getBackgroundColor(pressed),
          transform: [{ scale: pressed ? 0.96 : 1 }],
          opacity: disabled ? 0.5 : 1,
        },
        getBorderStyle(),
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              {
                color: getTextColor(),
                fontSize: size === 'sm' ? 12 : size === 'lg' ? 16 : 14,
                marginLeft: icon ? 8 : 0,
              },
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
  base: {
    borderRadius: DesignTokens.shapes.pill, // Pinterest continuous full pill
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
});
