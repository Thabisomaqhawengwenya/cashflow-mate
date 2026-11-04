import React from 'react';
import { View, Text, Image, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getPresetById } from '@/constants/Presets';
import { EmeraldTokens } from '@/constants/Colors';

interface TraderAvatarProps {
  size?: number;
  avatarUri?: string | null;
  avatarPreset?: string | null;
  name?: string | null;
  borderWidth?: number;
  borderColor?: string;
  showHalo?: boolean;
  haloColor?: string;
  style?: StyleProp<ViewStyle>;
}

export const TraderAvatar: React.FC<TraderAvatarProps> = ({
  size = 40,
  avatarUri,
  avatarPreset,
  name,
  borderWidth = 0,
  borderColor = 'transparent',
  showHalo = false,
  haloColor = EmeraldTokens.mintCta,
  style,
}) => {
  const preset = getPresetById(avatarPreset);
  const initials = (name || 'Mr Q')
    .trim()
    .slice(0, 2)
    .toUpperCase();

  const containerStyle = [
    styles.baseContainer,
    {
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: borderWidth,
      borderColor: borderColor,
    },
    showHalo && {
      shadowColor: haloColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.35,
      shadowRadius: size * 0.12,
      elevation: 4,
    },
    style,
  ];

  if (avatarUri && avatarUri.trim().length > 0) {
    return (
      <View style={containerStyle}>
        <Image
          source={{ uri: avatarUri }}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: size / 2,
          }}
          resizeMode="cover"
        />
      </View>
    );
  }

  if (preset) {
    return (
      <View
        style={[
          containerStyle,
          {
            backgroundColor: preset.bgColor,
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}
      >
        <Ionicons
          name={preset.icon}
          size={Math.round(size * 0.52)}
          color={preset.iconColor}
        />
      </View>
    );
  }

  // Fallback monogram initials on Deep Pine
  return (
    <View
      style={[
        containerStyle,
        {
          backgroundColor: EmeraldTokens.deepPine,
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}
    >
      <Text
        style={{
          fontSize: Math.round(size * 0.38),
          fontWeight: '800',
          color: '#FFFFFF',
          letterSpacing: 0.5,
        }}
      >
        {initials}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  baseContainer: {
    overflow: 'hidden',
  },
});
