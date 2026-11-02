import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import Colors, { EmeraldTokens } from '@/constants/Colors';
import { DesignTokens } from '@/constants/DesignTokens';
import { useColorScheme } from '@/components/useColorScheme';
import { useAppearance } from '@/context/AppearanceContext';

export interface M3InputProps extends TextInputProps {
  label: string;
  error?: string;
  prefix?: string;
}

export const M3Input: React.FC<M3InputProps> = ({ label, error, prefix, style, ...props }) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const { surfaces } = useAppearance();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: surfaces.textPrimary }]}>{label}</Text>
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: surfaces.inputBg,
            borderColor: error ? theme.outflow : surfaces.border,
          },
        ]}
      >
        {prefix ? (
          <Text style={[styles.prefixText, { color: surfaces.textMuted }]}>{prefix}</Text>
        ) : null}
        <TextInput
          style={[
            styles.input,
            {
              color: surfaces.textPrimary,
            },
            style,
          ]}
          placeholderTextColor={surfaces.textMuted || EmeraldTokens.textSubtle}
          {...props}
        />
      </View>
      {error ? (
        <Text style={[styles.error, { color: theme.outflow }]}>{error}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    width: '100%',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: DesignTokens.shapes.input,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  prefixText: {
    fontSize: 14,
    fontWeight: '700',
    marginRight: 6,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 14,
  },
  error: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
});
