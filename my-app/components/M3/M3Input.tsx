import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import Colors, { EmeraldTokens, BlueTokens } from '@/constants/Colors';
import { DesignTokens } from '@/constants/DesignTokens';
import { useColorScheme } from '@/components/useColorScheme';

export interface M3InputProps extends TextInputProps {
  label: string;
  error?: string;
  prefix?: string;
}

export const M3Input: React.FC<M3InputProps> = ({ label, error, prefix, style, ...props }) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: EmeraldTokens.textSlate }]}>{label}</Text>
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: '#F7F9FC',
            borderColor: error ? theme.outflow : BlueTokens.borders,
          },
        ]}
      >
        {prefix ? (
          <Text style={styles.prefixText}>{prefix}</Text>
        ) : null}
        <TextInput
          style={[
            styles.input,
            {
              color: EmeraldTokens.textSlate,
            },
            style,
          ]}
          placeholderTextColor={EmeraldTokens.textSubtle}
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
    color: EmeraldTokens.textMuted,
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
