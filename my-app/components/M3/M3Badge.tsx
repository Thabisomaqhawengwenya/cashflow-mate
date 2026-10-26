import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Colors from '@/constants/Colors';
import { DesignTokens } from '@/constants/DesignTokens';
import { useColorScheme } from '@/components/useColorScheme';

export interface M3BadgeProps {
  label: string;
  variant?: 'inflow' | 'outflow' | 'neutral' | 'review' | 'primary';
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export const M3Badge: React.FC<M3BadgeProps> = ({
  label,
  variant = 'primary',
  icon,
  style,
}) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];

  const getColors = () => {
    switch (variant) {
      case 'inflow':
        return { bg: theme.inflowContainer, text: theme.inflow, border: theme.inflow + '33' };
      case 'outflow':
        return { bg: theme.outflowContainer, text: theme.outflow, border: theme.outflow + '33' };
      case 'neutral':
        return { bg: theme.neutralContainer, text: theme.neutral, border: theme.neutral + '33' };
      case 'review':
        return { bg: theme.reviewContainer, text: theme.review, border: theme.review + '33' };
      default:
        return { bg: theme.primaryContainer, text: theme.onPrimaryContainer, border: 'transparent' };
    }
  };

  const { bg, text, border } = getColors();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          borderColor: border,
        },
        style,
      ]}
    >
      {icon}
      <Text style={[styles.text, { color: text, marginLeft: icon ? 4 : 0 }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: DesignTokens.shapes.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
});
