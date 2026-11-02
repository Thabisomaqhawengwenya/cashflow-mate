import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { DesignTokens } from '@/constants/DesignTokens';
import { useAppearance } from '@/context/AppearanceContext';

export interface M3CardProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'container' | 'kpi' | 'action';
  style?: StyleProp<ViewStyle>;
}

export const M3Card: React.FC<M3CardProps> = ({ children, variant = 'elevated', style }) => {
  const { surfaces, cardRadius } = useAppearance();

  const backgroundColor =
    variant === 'container' ? surfaces.cardElevatedBg : surfaces.cardBg;

  return (
    <View
      style={[
        styles.card,
        DesignTokens.shadows.softCard,
        {
          backgroundColor,
          borderRadius: cardRadius,
          borderColor: surfaces.border,
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
  },
});
