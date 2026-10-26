import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import Colors from '@/constants/Colors';
import { DesignTokens } from '@/constants/DesignTokens';
import { useColorScheme } from '@/components/useColorScheme';

export interface M3InputProps extends TextInputProps {
  label: string;
  error?: string;
}

export const M3Input: React.FC<M3InputProps> = ({ label, error, style, ...props }) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.surfaceContainer,
            color: theme.text,
            borderColor: error ? theme.outflow : theme.outline,
          },
          style,
        ]}
        placeholderTextColor={theme.tabIconDefault}
        {...props}
      />
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
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  input: {
    height: 50, // Standard 50px input height
    borderRadius: DesignTokens.shapes.input,
    paddingHorizontal: 14,
    borderWidth: 1,
    fontSize: 14,
  },
  error: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
});
