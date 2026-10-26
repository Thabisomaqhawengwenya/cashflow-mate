import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Colors from '@/constants/Colors';
import { DesignTokens } from '@/constants/DesignTokens';
import { useColorScheme } from '@/components/useColorScheme';

export interface M3CardProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'container' | 'kpi';
  style?: StyleProp<ViewStyle>;
}

export const M3Card: React.FC<M3CardProps> = ({ children, variant = 'elevated', style }) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];

  const borderRadius =
    variant === 'kpi' ? DesignTokens.shapes.kpiCard : DesignTokens.shapes.card;

  const backgroundColor =
    variant === 'container' ? theme.surfaceContainer : theme.surface;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor,
          borderRadius,
          borderColor: theme.outlineVariant,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: DesignTokens.spacing.cardPadding,
    borderWidth: 1,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
});
