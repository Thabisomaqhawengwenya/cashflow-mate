import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Colors, { EmeraldTokens } from '@/constants/Colors';
import { DesignTokens } from '@/constants/DesignTokens';
import { useColorScheme } from '@/components/useColorScheme';

export interface M3BadgeProps {
  label: string;
  variant?: 'primary' | 'mint' | 'inflow' | 'outflow' | 'review' | 'neutral' | 'purple' | 'amber';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const M3Badge: React.FC<M3BadgeProps> = ({
  label,
  variant = 'neutral',
  style,
  textStyle,
}) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];

  const getColors = () => {
    switch (variant) {
      case 'mint':
      case 'inflow':
        return { bg: EmeraldTokens.pastelMint, text: EmeraldTokens.pastelMintText };
      case 'outflow':
        return { bg: EmeraldTokens.pastelRose, text: EmeraldTokens.pastelRoseText };
      case 'purple':
        return { bg: EmeraldTokens.pastelIndigo, text: EmeraldTokens.pastelIndigoText };
      case 'amber':
      case 'review':
        return { bg: EmeraldTokens.pastelAmber, text: EmeraldTokens.pastelAmberText };
      case 'primary':
        return { bg: theme.primaryContainer, text: theme.onPrimaryContainer };
      case 'neutral':
      default:
        return { bg: theme.neutralContainer, text: theme.neutral };
    }
  };

  const { bg, text } = getColors();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          borderRadius: DesignTokens.shapes.pill,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: text,
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});
