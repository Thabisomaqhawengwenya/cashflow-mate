import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, ActivityIndicator, TextStyle } from 'react-native';
import Colors from '@/constants/Colors';
import { DesignTokens } from '@/constants/DesignTokens';
import { useColorScheme } from '@/components/useColorScheme';
import { useAppearance } from '@/context/AppearanceContext';

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
  const { palette, surfaces, buttonRadius } = useAppearance();

  const height = DesignTokens.buttonHeights[size];

  const getBackgroundColor = (pressed: boolean) => {
    if (disabled) return surfaces.cardElevatedBg;
    if (variant === 'mint' || variant === 'filled') {
      return pressed ? palette.headerBg : palette.primary;
    }
    if (variant === 'tonal') return pressed ? palette.surfaceTint : surfaces.cardElevatedBg;
    if (variant === 'outlined' || variant === 'text')
      return pressed ? palette.surfaceTint : 'transparent';
    return palette.primary;
  };

  const getTextColor = () => {
    if (disabled) return surfaces.textMuted;
    if (variant === 'mint' || variant === 'filled') return '#FFFFFF';
    if (variant === 'tonal') return surfaces.textPrimary;
    if (variant === 'outlined' || variant === 'text') return palette.primary;
    return '#FFFFFF';
  };

  const getBorderStyle = () => {
    if (variant === 'outlined') {
      return {
        borderWidth: 1,
        borderColor: surfaces.border,
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
          borderRadius: buttonRadius,
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
